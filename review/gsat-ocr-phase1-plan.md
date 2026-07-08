# 學測英文 OCR Phase 1 計畫

目前尚未開始 OCR。

## 原則

- 不批次處理 33 年。
- 先只處理 115 學年度英文。
- 先產出一份樣板，確認 OCR 品質與 JSON 欄位後再擴大處理。

## Phase 1 檢查項目

- OCR 正確率
- 表格是否跑版
- 閱讀段落是否斷行錯亂
- 圖片或圖表是否遺失
- 選項 A、B、C、D 是否對應正確
- 題號是否保留
- 答案是否能從官方答案 PDF 對上

## JSON 設計

採用「一題一個 JSON」概念，不採用「一份試卷一個 JSON」。

參考格式：

```json
{
  "id": "GSAT-115-Q01",
  "year": 115,
  "exam": "GSAT",
  "section": "Vocabulary",
  "type": "Single Choice",
  "question": "",
  "options": {
    "A": "",
    "B": "",
    "C": "",
    "D": ""
  },
  "answer": ""
}
```

完整樣板見：

- data/gsat_question_schema.example.json
