import json
import re
from pathlib import Path

import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "tmp_pdf" / "toeic_vocab.pdf"
OUT_SOURCE = ROOT / "data" / "vocab_toeic_pdf_source.json"
OUT_VOCAB = ROOT / "data" / "vocab_toeic.json"
REVIEW_MD = ROOT / "review" / "toeic-vocab-import-review.md"

LETTER_HEADINGS = set("ABCDEFGHIJKLMNOPQRSTUVWXYZ")

CURATED = {
    "achieve": {
        "part_of_speech": ["verb"],
        "forms": {"base": "achieve", "third_person": "achieves", "past": "achieved", "past_participle": "achieved", "ing": "achieving"},
        "word_family": {"verb": "achieve", "noun": "achievement", "adjective": "achievable"},
        "examples": [{"sentence": "The team worked hard to achieve its sales goal.", "translation": ""}],
        "common_collocations": ["achieve a goal", "achieve success", "achieve results"],
    },
    "admit": {
        "part_of_speech": ["verb"],
        "forms": {"base": "admit", "third_person": "admits", "past": "admitted", "past_participle": "admitted", "ing": "admitting"},
        "word_family": {"verb": "admit", "noun": "admission"},
        "examples": [{"sentence": "The manager admitted the mistake during the meeting.", "translation": ""}],
        "common_collocations": ["admit a mistake", "admit responsibility", "be admitted to"],
    },
    "apply": {
        "part_of_speech": ["verb"],
        "forms": {"base": "apply", "third_person": "applies", "past": "applied", "past_participle": "applied", "ing": "applying"},
        "word_family": {"verb": "apply", "noun": "application", "person": "applicant", "adjective": "applicable"},
        "examples": [{"sentence": "Several candidates applied for the position.", "translation": ""}],
        "common_collocations": ["apply for a job", "apply to a position", "submit an application"],
    },
    "attend": {
        "part_of_speech": ["verb"],
        "forms": {"base": "attend", "third_person": "attends", "past": "attended", "past_participle": "attended", "ing": "attending"},
        "word_family": {"verb": "attend", "noun": "attendance", "person": "attendee"},
        "examples": [{"sentence": "All supervisors attended the training session.", "translation": ""}],
        "common_collocations": ["attend a meeting", "attend a conference", "attendance record"],
    },
    "contract": {
        "part_of_speech": ["noun"],
        "forms": None,
        "word_family": {"noun": "contract", "verb": "contract", "adjective": "contractual", "person": "contractor"},
        "examples": [{"sentence": "Both parties signed the contract yesterday.", "translation": ""}],
        "common_collocations": ["sign a contract", "renew a contract", "contract terms"],
    },
    "negotiate": {
        "part_of_speech": ["verb"],
        "forms": {"base": "negotiate", "third_person": "negotiates", "past": "negotiated", "past_participle": "negotiated", "ing": "negotiating"},
        "word_family": {"verb": "negotiate", "noun": "negotiation", "adjective": "negotiable", "person": "negotiator"},
        "examples": [{"sentence": "The company negotiated a new contract with the supplier.", "translation": ""}],
        "common_collocations": ["negotiate a contract", "negotiate a deal", "negotiate terms", "negotiate with clients"],
    },
    "purchase": {
        "part_of_speech": ["verb", "noun"],
        "forms": {"base": "purchase", "third_person": "purchases", "past": "purchased", "past_participle": "purchased", "ing": "purchasing"},
        "word_family": {"verb": "purchase", "noun": "purchase", "person": "purchaser"},
        "examples": [{"sentence": "The company plans to purchase new equipment.", "translation": ""}],
        "common_collocations": ["purchase order", "purchase price", "make a purchase"],
    },
}


def clean_cell(value):
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def is_heading(text):
    return text in LETTER_HEADINGS or re.fullmatch(r"[Ａ-Ｚ]", text or "") is not None


def looks_like_english(text):
    if not text or is_heading(text):
        return False
    return bool(re.search(r"[A-Za-z]", text))


def looks_like_chinese(text):
    return bool(re.search(r"[\u4e00-\u9fff]", text or ""))


def extract_pairs_from_row(row):
    cells = [clean_cell(c) for c in row]
    pairs = []
    i = 0
    while i < len(cells):
        word = cells[i]
        if looks_like_english(word):
            for offset in (1, 2):
                meaning_index = i + offset
                if meaning_index < len(cells) and looks_like_chinese(cells[meaning_index]):
                    pairs.append((word, cells[meaning_index]))
                    i = meaning_index + 1
                    break
            else:
                i += 1
            continue
        i += 1
    return pairs


def infer_pos(word):
    lower = word.lower()
    if " " in lower or "／" in lower or "/" in lower:
        return ["phrase"]
    if lower.endswith("ly"):
        return ["adverb"]
    if lower.endswith(("tion", "sion", "ment", "ness", "ity", "ance", "ence", "ship", "er", "or", "ist", "age", "ure", "ism")):
        return ["noun"]
    if lower.endswith(("able", "ible", "al", "ive", "ous", "ful", "less", "ic", "ary")):
        return ["adjective"]
    return ["word"]


def normalize_word(word):
    word = word.replace("／", " / ")
    return re.sub(r"\s+", " ", word).strip()


def existing_by_word():
    if not OUT_VOCAB.exists():
        return {}
    data = json.loads(OUT_VOCAB.read_text(encoding="utf-8-sig"))
    if isinstance(data, dict) and "value" in data:
        data = data["value"]
    return {item["word"].lower(): item for item in data}


def has_complete_detail(item):
    if not item["word_family"] or not item["examples"] or not item["common_collocations"]:
        return False
    if "verb" in item["part_of_speech"] and not item["forms"]:
        return False
    return True


def build_review(vocab):
    review_count = sum(1 for item in vocab if item.get("detail_review_status") == "needs_review")
    lines = [
        "# TOEIC 單字表匯入摘要",
        "",
        "- 來源：多益單字表.pdf",
        f"- 匯入單字 / 片語：{len(vocab)}",
        f"- 詞族、例句或搭配仍待補齊：{review_count}",
        "",
        "## 前 100 筆樣本",
        "",
        "| 單字 | 詞性 | 中文 | 頁碼 | 待補資料 |",
        "|---|---|---|---:|---|",
    ]
    for item in vocab[:100]:
        missing = []
        if not item["word_family"]:
            missing.append("詞族")
        if not item["examples"]:
            missing.append("例句")
        if not item["common_collocations"]:
            missing.append("搭配")
        if "verb" in item["part_of_speech"] and not item["forms"]:
            missing.append("動詞變化")
        lines.append(
            f"| {item['word']} | {', '.join(item['part_of_speech'])} | {item['meaningZh']} | {item['source_page']} | {'、'.join(missing) or '已補齊'} |"
        )
    REVIEW_MD.write_text("\n".join(lines), encoding="utf-8")


def main():
    seen = {}
    rows = []
    with pdfplumber.open(PDF_PATH) as pdf:
        for page_no, page in enumerate(pdf.pages, start=1):
            for table in page.extract_tables() or []:
                for row in table:
                    for word, meaning in extract_pairs_from_row(row):
                        word = normalize_word(word)
                        meaning = clean_cell(meaning)
                        key = word.lower()
                        if not word or not meaning or key in seen:
                            continue
                        seen[key] = True
                        rows.append({
                            "word": word,
                            "meaningZh": meaning,
                            "chinese": meaning,
                            "source_page": page_no,
                            "source": "多益單字表.pdf",
                        })

    old = existing_by_word()
    vocab = []
    for idx, row in enumerate(rows, start=1):
        key = row["word"].lower()
        old_item = old.get(key, {})
        if old_item.get("source_type") == "user_provided_pdf":
            old_item = {}
        curated = CURATED.get(key, {})
        pos = curated.get("part_of_speech") or old_item.get("part_of_speech") or infer_pos(row["word"])
        item = {
            "id": f"V_TOEIC_{idx:04d}",
            "word": row["word"],
            "level": "toeic",
            "topic": "TOEIC 550up",
            "source": row["source"],
            "source_page": row["source_page"],
            "source_type": "user_provided_pdf",
            "review_status": "user_confirmed_source",
            "part_of_speech": pos,
            "meaningZh": row["meaningZh"],
            "chinese": row["chinese"],
            "simple_definition": old_item.get("simple_definition", ""),
            "word_family": curated.get("word_family") or old_item.get("word_family") or {},
            "forms": curated.get("forms") or (old_item.get("forms") if "verb" in pos else None),
            "examples": curated.get("examples") or old_item.get("examples") or [],
            "common_collocations": curated.get("common_collocations") or old_item.get("common_collocations") or [],
            "common_error": old_item.get("common_error", ""),
            "tags": ["toeic", "user_pdf"],
        }
        if "verb" not in item["part_of_speech"]:
            item["forms"] = None
        if not has_complete_detail(item):
            item["detail_review_status"] = "needs_review"
        vocab.append(item)

    OUT_SOURCE.write_text(
        json.dumps({"source": "多益單字表.pdf", "total": len(rows), "entries": rows}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    OUT_VOCAB.write_text(json.dumps(vocab, ensure_ascii=False, indent=2), encoding="utf-8")

    REVIEW_MD.parent.mkdir(parents=True, exist_ok=True)
    build_review(vocab)
    review_count = sum(1 for item in vocab if item.get("detail_review_status") == "needs_review")
    print(json.dumps({"imported": len(vocab), "review": review_count, "source": str(OUT_SOURCE), "vocab": str(OUT_VOCAB)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
