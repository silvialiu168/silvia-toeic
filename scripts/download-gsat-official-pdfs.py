import json
import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_JSON = ROOT / "data" / "gsat_official_sources.json"
OFFICIAL_ROOT = ROOT / "official" / "gsat"
METADATA_JSON = OFFICIAL_ROOT / "metadata.json"
REPORT_MD = ROOT / "review" / "gsat-official-local-pdf-report.md"

NAME_MAP = {
    "question": "question.pdf",
    "answer": "answer.pdf",
    "answer_sheet": "answer_sheet.pdf",
    "scoring_guideline": "rubric.pdf",
    "official_note": "official_note.pdf",
}


def curl_download(url, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        return {"downloaded": False, "ok": True, "bytes": dest.stat().st_size, "status": "exists"}
    tmp = dest.with_suffix(dest.suffix + ".tmp")
    if tmp.exists():
        tmp.unlink()
    cmd = [
        "curl.exe",
        "-L",
        "--fail",
        "--connect-timeout",
        "20",
        "--max-time",
        "180",
        "-A",
        "Mozilla/5.0",
        url,
        "-o",
        str(tmp),
        "-w",
        "HTTP=%{http_code}",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    http_match = re.search(r"HTTP=(\d+)", (result.stdout or "") + (result.stderr or ""))
    http = int(http_match.group(1)) if http_match else None
    if result.returncode == 0 and tmp.exists() and tmp.stat().st_size > 0:
        tmp.replace(dest)
        return {"downloaded": True, "ok": True, "bytes": dest.stat().st_size, "status": http}
    if tmp.exists():
        tmp.unlink()
    return {
        "downloaded": False,
        "ok": False,
        "bytes": 0,
        "status": http,
        "error": (result.stderr or result.stdout or "").strip()[-500:],
    }


def default_features(year, has_rubric):
    # These are exam-level capability flags for the English GSAT paper family.
    # They do not replace OCR-based section tagging in the next phase.
    return {
        "reading": True,
        "vocabulary": True,
        "cloze": True,
        "translation": True,
        "writing": True,
        "needs_ocr_confirmation": True,
        "note": "依學測英文常見卷型先標記；正式題型仍需 OCR 後逐題確認。",
    }


def main():
    sources = json.loads(SOURCE_JSON.read_text(encoding="utf-8"))
    metadata = []
    download_rows = []

    for item in sources:
        year = item["year"]
        year_dir = OFFICIAL_ROOT / str(year)
        pdfs = {}
        download_status = {}

        for kind, filename in NAME_MAP.items():
            url = item.get("pdf_links", {}).get(kind)
            if not url:
                pdfs[kind] = None
                download_status[kind] = {"ok": False, "status": "official_not_provided"}
                continue
            dest = year_dir / filename
            result = curl_download(url, dest)
            pdfs[kind] = str(dest.relative_to(ROOT)).replace("\\", "/") if result["ok"] else None
            download_status[kind] = {**result, "url": url}
            download_rows.append((year, kind, result))

        additional = []
        for idx, extra in enumerate(item.get("pdf_links", {}).get("additional_pdfs", []) or [], start=1):
            url = extra.get("url")
            kind = extra.get("kind", "other_pdf")
            dest = year_dir / f"additional_{idx:02d}_{kind}.pdf"
            result = curl_download(url, dest)
            additional.append({
                "kind": kind,
                "label": extra.get("label", ""),
                "title": extra.get("title", ""),
                "url": url,
                "local_pdf": str(dest.relative_to(ROOT)).replace("\\", "/") if result["ok"] else None,
                "download": result,
            })
            download_rows.append((year, f"additional:{kind}", result))

        metadata.append({
            "year": year,
            "exam": "GSAT",
            "subject": "English",
            "exam_name": item.get("exam_name", ""),
            "official_source_url": item.get("official_source_url", ""),
            "published_date": item.get("published_date", ""),
            "question_pdf": pdfs["question"],
            "answer_pdf": pdfs["answer"],
            "answer_sheet_pdf": pdfs["answer_sheet"],
            "rubric_pdf": pdfs["scoring_guideline"],
            "official_note_pdf": pdfs["official_note"],
            "additional_pdfs": additional,
            "reading": True,
            "vocabulary": True,
            "cloze": True,
            "translation": True,
            "writing": True,
            "type_flags_need_ocr_confirmation": True,
            "features": default_features(year, bool(pdfs["scoring_guideline"])),
            "source_status": {
                "question": "provided" if item.get("has_question") else "official_not_provided",
                "answer": "provided" if item.get("has_answer") else "official_not_provided",
                "answer_sheet": "provided" if item.get("has_answer_sheet") else "official_not_provided",
                "rubric": "provided" if item.get("has_scoring_guideline") else "official_not_provided",
                "official_note": "provided" if item.get("has_official_note") else "official_not_provided",
            },
            "download_status": download_status,
            "ocr_status": "not_started",
            "json_status": "not_started",
        })

    METADATA_JSON.parent.mkdir(parents=True, exist_ok=True)
    METADATA_JSON.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")

    total = sum(1 for _, _, r in download_rows)
    ok = sum(1 for _, _, r in download_rows if r.get("ok"))
    lines = [
        "# 學測英文官方 PDF 本地化報告",
        "",
        "日期：2026-07-08",
        "",
        "本次只下載大考中心官方清單中的 PDF，不進行 OCR、不拆題、不改題目內容。",
        "",
        "## 統計",
        "",
        f"- 年份：{metadata[0]['year']}～{metadata[-1]['year']}，共 {len(metadata)} 年",
        f"- 官方 PDF 下載成功：{ok}/{total}",
        f"- Metadata：official/gsat/metadata.json",
        "",
        "## 年度清單",
        "",
        "| 年度 | 試題 | 答案 | 答題卷 | 評分標準 | 額外 PDF |",
        "|---:|---|---|---|---|---:|",
    ]
    for row in metadata:
        lines.append(
            f"| {row['year']} | {'有' if row['question_pdf'] else '缺'} | {'有' if row['answer_pdf'] else '缺'} | "
            f"{'有' if row['answer_sheet_pdf'] else '官方未提供'} | {'有' if row['rubric_pdf'] else '官方未提供'} | {len(row['additional_pdfs'])} |"
        )
    failures = [(y, k, r) for y, k, r in download_rows if not r.get("ok")]
    if failures:
        lines.extend(["", "## 下載異常", ""])
        for year, kind, result in failures:
            lines.append(f"- {year} {kind}: {result}")
    REPORT_MD.write_text("\n".join(lines), encoding="utf-8")

    print(json.dumps({"years": len(metadata), "pdf_downloads_ok": ok, "pdf_downloads_total": total, "failures": len(failures)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
