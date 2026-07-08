import html
import json
import re
import ssl
import subprocess
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urljoin


ROOT = Path(__file__).resolve().parents[1]
BASE = "https://www.ceec.edu.tw"
HTML_GLOB = "tmp_ceec_page*.html"
OUT_JSON = ROOT / "data" / "gsat_official_sources.json"
OUT_REPORT = ROOT / "review" / "gsat-official-question-bank-report.md"


def clean(text):
    return re.sub(r"\s+", " ", html.unescape(text or "")).strip()


def extract_attrs(tag):
    return {m.group(1): html.unescape(m.group(2)) for m in re.finditer(r'([\w-]+)="([^"]*)"', tag)}


def classify_link(label, title, href):
    text = f"{label} {title} {href}".lower()
    zh = f"{label} {title}"
    if not href.lower().endswith(".pdf"):
        return None
    if "評分" in zh:
        return "scoring_guideline"
    if "試題內容" in zh or "試卷" in zh or "試題" in zh:
        return "question"
    if "選擇題答案" in zh or "答案" in zh or "參考答案" in zh:
        return "answer"
    if "答題卷" in zh:
        return "answer_sheet"
    if "說明" in zh:
        return "official_note"
    return "other_pdf"


def parse_pages():
    entries = {}
    for path in sorted(ROOT.glob(HTML_GLOB), key=lambda p: int(re.search(r"page(\d+)", p.name).group(1))):
        page_no = int(re.search(r"page(\d+)", path.name).group(1))
        text = path.read_text(encoding="utf-8", errors="ignore")
        for tr in re.findall(r"<tr\b.*?</tr>", text, flags=re.S | re.I):
            title_match = re.search(r'<td class="title">\s*(.*?)\s*</td>', tr, flags=re.S | re.I)
            if not title_match:
                continue
            exam_title = clean(re.sub(r"<.*?>", "", title_match.group(1)))
            m = re.search(r"(\d{2,3})學年度學科能力測驗－英文", exam_title)
            if not m:
                continue
            year = int(m.group(1))
            date_match = re.search(r'<td class="date">\s*(.*?)\s*</td>', tr, flags=re.S | re.I)
            item = entries.setdefault(year, {
                "year": year,
                "exam_name": exam_title,
                "official_source_url": f"{BASE}/xmfile?page={page_no}&xsmsid=0J052424829869345634",
                "published_date": clean(date_match.group(1)) if date_match else "",
                "has_question": False,
                "has_answer": False,
                "has_answer_sheet": False,
                "has_scoring_guideline": False,
                "has_official_note": False,
                "downloaded": False,
                "pdf_links": {},
                "link_checks": {},
                "notes": "",
            })
            for a in re.findall(r"<a\b[^>]*>.*?</a>", tr, flags=re.S | re.I):
                attrs = extract_attrs(a)
                href = attrs.get("href", "")
                label = clean(re.sub(r"<.*?>", "", a))
                title = attrs.get("title", "")
                kind = classify_link(label, title, href)
                if not kind:
                    continue
                full_url = urljoin(BASE, href)
                if kind not in item["pdf_links"]:
                    item["pdf_links"][kind] = full_url
                elif item["pdf_links"][kind] != full_url:
                    item["pdf_links"].setdefault("additional_pdfs", []).append({
                        "kind": kind,
                        "label": label,
                        "title": title,
                        "url": full_url,
                    })
            item["has_question"] = "question" in item["pdf_links"]
            item["has_answer"] = "answer" in item["pdf_links"]
            item["has_answer_sheet"] = "answer_sheet" in item["pdf_links"]
            item["has_scoring_guideline"] = "scoring_guideline" in item["pdf_links"]
            item["has_official_note"] = "official_note" in item["pdf_links"]
    return [entries[y] for y in sorted(entries.keys(), reverse=True)]


def check_url(url, timeout=10):
    cmd = [
        "curl.exe",
        "-I",
        "-L",
        "--connect-timeout",
        str(timeout),
        "--max-time",
        str(timeout + 15),
        "-A",
        "Mozilla/5.0",
        url,
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 20)
        output = (result.stdout or "") + (result.stderr or "")
        statuses = [int(x) for x in re.findall(r"HTTP/\S+\s+(\d{3})", output)]
        status = statuses[-1] if statuses else None
        ctype_match = re.findall(r"(?im)^content-type:\s*([^\r\n]+)", output)
        ctype = ctype_match[-1].strip() if ctype_match else ""
        return {
            "ok": bool(status and 200 <= status < 400 and "pdf" in ctype.lower()),
            "status": status,
            "content_type": ctype,
            "method": "curl HEAD",
        }
    except Exception as exc:
        return {"ok": False, "status": None, "content_type": "", "method": "curl HEAD", "error": str(exc)}


def verify_links(entries):
    jobs = []
    with ThreadPoolExecutor(max_workers=12) as executor:
        for item in entries:
            for kind, url in item["pdf_links"].items():
                if kind == "additional_pdfs":
                    continue
                jobs.append({"future": executor.submit(check_url, url), "item": item, "kind": kind, "extra": None})
            if item["pdf_links"].get("additional_pdfs"):
                for extra in item["pdf_links"]["additional_pdfs"]:
                    jobs.append({"future": executor.submit(check_url, extra["url"]), "item": item, "kind": "additional", "extra": extra})
        for job in jobs:
            result = job["future"].result()
            if job["extra"] is not None:
                job["extra"]["check"] = result
            else:
                job["item"]["link_checks"][job["kind"]] = result

    for item in entries:
        missing = []
        if not item["has_question"]:
            missing.append("官方試題 PDF")
        if not item["has_answer"]:
            missing.append("官方答案 PDF")
        if not item["has_scoring_guideline"]:
            missing.append("非選擇題評分標準")
        broken = [k for k, v in item["link_checks"].items() if not v.get("ok")]
        note_parts = []
        if missing:
            note_parts.append("缺少：" + "、".join(missing))
        if broken:
            note_parts.append("連結異常：" + "、".join(broken))
        if not note_parts:
            note_parts.append("官方試題、答案與評分標準均已找到，PDF 連結可開啟。")
        item["notes"] = "；".join(note_parts)


def pct(count, total):
    return f"{round(count / total * 100)}%" if total else "0%"


def build_report(entries):
    total = len(entries)
    question_ok = sum(1 for e in entries if e["has_question"] and e["link_checks"].get("question", {}).get("ok"))
    answer_ok = sum(1 for e in entries if e["has_answer"] and e["link_checks"].get("answer", {}).get("ok"))
    scoring_ok = sum(1 for e in entries if e["has_scoring_guideline"] and e["link_checks"].get("scoring_guideline", {}).get("ok"))
    complete = sum(1 for e in entries if all([
        e["has_question"], e["has_answer"], e["has_scoring_guideline"],
        e["link_checks"].get("question", {}).get("ok"),
        e["link_checks"].get("answer", {}).get("ok"),
        e["link_checks"].get("scoring_guideline", {}).get("ok"),
    ]))
    expected_years = list(range(max(e["year"] for e in entries), min(e["year"] for e in entries) - 1, -1))
    found_years = {e["year"] for e in entries}
    missing_years = [y for y in expected_years if y not in found_years]
    lines = [
        "# 學測英文官方題庫完整性報告",
        "",
        "日期：2026-07-08",
        "",
        "## 收集原則",
        "",
        "本次只收錄大考中心官方公開頁面與官方 PDF 連結。不使用補習班、出版社教材、付費題庫或未授權轉載資料。",
        "",
        "本輪只做「官方資料完整性」建設：",
        "",
        "- 不下載 PDF",
        "- 不轉文字",
        "- 不拆題",
        "- 不改官方題目內容",
        "- 不補寫解析",
        "",
        "## 官方來源",
        "",
        "- 大考中心：學科能力測驗 → 歷年試題及答題卷 → 一般試題",
        "- 官方列表網址：https://www.ceec.edu.tw/xmfile?xsmsid=0J052424829869345634",
        "",
        "## 已收集年份",
        "",
        f"本輪已完成 {max(found_years)}～{min(found_years)} 學年度英文科官方來源盤點，共 {total} 年。",
        "",
        "| 年度 | 官方試題 | 答案 | 評分標準 | 下載連結驗證 | 已下載 | 備註 |",
        "|---:|---|---|---|---|---|---|",
    ]
    for e in entries:
        q = "有" if e["has_question"] else "缺"
        a = "有" if e["has_answer"] else "缺"
        s = "有" if e["has_scoring_guideline"] else "缺"
        checks = []
        for key, label in (("question", "試題"), ("answer", "答案"), ("scoring_guideline", "評分")):
            c = e["link_checks"].get(key)
            checks.append(f"{label}{'OK' if c and c.get('ok') else '異常/缺'}")
        lines.append(f"| {e['year']} | {q} | {a} | {s} | {'、'.join(checks)} | 否 | {e['notes']} |")
    lines.extend([
        "",
        "## 缺失年份",
        "",
        "官方列表本輪可解析到的最早學測英文年份為 83 學年度。",
        "",
    ])
    if missing_years:
        lines.append("以下年份在 115～83 範圍內未於本輪官方列表解析到：")
        lines.append("")
        lines.append("- " + "、".join(map(str, missing_years)))
    else:
        lines.append("115～83 學年度英文科均已於官方列表中解析到，沒有年份缺口。")
    lines.extend([
        "",
        "## 詳細清單",
        "",
    ])
    for e in entries:
        lines.extend([
            f"### {e['year']} 學年度",
            "",
            f"- 考試名稱：{e['exam_name']}",
            f"- 官方來源網址：{e['official_source_url']}",
            f"- 是否包含答案：{'是' if e['has_answer'] else '否'}",
            f"- 是否包含評分標準：{'是' if e['has_scoring_guideline'] else '否'}",
            f"- 是否包含答題卷：{'是' if e['has_answer_sheet'] else '否'}",
            f"- 官方說明文件：{'有' if e['has_official_note'] else '本年度條目未見'}",
        ])
        for key, label in (("question", "試題 PDF"), ("answer", "答案 PDF"), ("answer_sheet", "答題卷 PDF"), ("scoring_guideline", "評分標準 PDF"), ("official_note", "官方說明 PDF")):
            url = e["pdf_links"].get(key, "")
            c = e["link_checks"].get(key, {})
            if url:
                status = f"（驗證：{'OK' if c.get('ok') else '異常'}{', HTTP ' + str(c.get('status')) if c.get('status') else ''}）"
                lines.append(f"- {label}：{url} {status}")
            else:
                lines.append(f"- {label}：官方條目未提供")
        lines.extend([f"- 備註：{e['notes']}", ""])
    lines.extend([
        "## 統計",
        "",
        f"- 官方題庫覆蓋年份：{max(found_years)}～{min(found_years)}",
        f"- 已完成年份：{total} 年",
        f"- 缺失年份：{len(missing_years)} 年",
        f"- 完整年份（試題、答案、評分標準皆有且連結可開）：{complete} 年",
        f"- 試題 PDF 覆蓋率：{pct(question_ok, total)}（{question_ok}/{total}）",
        f"- 答案 PDF 覆蓋率：{pct(answer_ok, total)}（{answer_ok}/{total}）",
        f"- 評分標準覆蓋率：{pct(scoring_ok, total)}（{scoring_ok}/{total}）",
        "",
        "## 後續建議",
        "",
        "1. 由人工確認本報告中的缺漏或異常連結標記。",
        "2. 若確認官方資料完整，再進入下一階段：官方 PDF → 結構化 JSON。",
        "3. 下一階段仍需保留原題號、年度、官方 PDF URL 與答案來源，方便日後追溯。",
    ])
    OUT_REPORT.write_text("\n".join(lines), encoding="utf-8")


def main():
    entries = parse_pages()
    verify_links(entries)
    OUT_JSON.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
    build_report(entries)
    print(json.dumps({
        "years": [e["year"] for e in entries],
        "count": len(entries),
        "min": min(e["year"] for e in entries),
        "max": max(e["year"] for e in entries),
        "missing_scoring": [e["year"] for e in entries if not e["has_scoring_guideline"]],
        "broken": [{e["year"]: [k for k, v in e["link_checks"].items() if not v.get("ok")]} for e in entries if any(not v.get("ok") for v in e["link_checks"].values())],
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
