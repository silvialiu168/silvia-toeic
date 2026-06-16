# Family English Challenge 待審核題庫

請逐題審核以下 60 題。這些題目目前都不會進入正式練習。

## 審核原則

1. 正確性優先於題量。答案必須唯一且無爭議。
2. 題目英文必須自然、正確，不能有不自然搭配或語法錯誤。
3. 四個選項必須合理；不能存在兩個都可接受的答案。
4. 知識點與分類必須符合實際考點。
5. 解析要用繁體中文，清楚說明為什麼答案正確。
6. 學測題需符合台灣高中學測程度；會考題需符合台灣國中教育會考程度；TOEIC 題需符合商務情境。
7. 不確定的題目請標記 reject，不要勉強通過。

## 請回傳的格式

請回傳一個 JSON 陣列。每題必須包含：

```json
[
  {
    "review_id": "照原值回傳",
    "decision": "approved / revise / reject",
    "correct_answer_letter": "A / B / C / D",
    "correct_answer_text": "正確答案文字",
    "knowledge_id": "正確知識點 ID",
    "category": "正確分類",
    "revised_question": "若不需修改，照原題回傳",
    "revised_options": ["A", "B", "C", "D"],
    "revised_explanation": "繁體中文解析",
    "issues": ["發現的問題；無問題則留空陣列"],
    "confidence": "high / medium / low"
  }
]
```

只有 decision=approved 或 revise 且 confidence=high 的題目，才會考慮進入正式題庫。

## TOEIC Part 5

### TOEIC Part 5_1

**題目：** The receptionist greeted every visitor _____.

- A. courteous
- B. courteously
- C. courtesy
- D. courteousness

**目前答案：** B. courteously

**目前分類：** 詞性判斷 / pos-adverb

**目前解析：** 動詞 / 形容詞 + 副詞。副詞用於說明動作如何發生，或修飾形容詞。 本題正確答案是 “courteously”。

### TOEIC Part 5_2

**題目：** The revised software operates much more _____ than the previous version.

- A. efficient
- B. efficiency
- C. efficiently
- D. efficiencies

**目前答案：** C. efficiently

**目前分類：** 詞性判斷 / pos-adverb

**目前解析：** 動詞 / 形容詞 + 副詞。副詞用於說明動作如何發生，或修飾形容詞。 本題正確答案是 “efficiently”。

### TOEIC Part 5_3

**題目：** Please read the warranty terms _____ before signing the form.

- A. careful
- B. carefully
- C. care
- D. carefulness

**目前答案：** B. carefully

**目前分類：** 詞性判斷 / pos-adverb

**目前解析：** 動詞 / 形容詞 + 副詞。副詞用於說明動作如何發生，或修飾形容詞。 本題正確答案是 “carefully”。

### TOEIC Part 5_4

**題目：** Ms. Patel's _____ of the budget helped the team reduce costs.

- A. review
- B. reviewed
- C. reviewing
- D. reviewable

**目前答案：** A. review

**目前分類：** 詞性判斷 / pos-noun

**目前解析：** 冠詞 / 所有格 + 名詞。冠詞 a、an、the 或所有格後通常接名詞。 本題正確答案是 “review”。

### TOEIC Part 5_5

**題目：** The committee reached a _____ after reviewing all proposals.

- A. decide
- B. decisive
- C. decision
- D. decisively

**目前答案：** C. decision

**目前分類：** 詞性判斷 / pos-noun

**目前解析：** 冠詞 / 所有格 + 名詞。冠詞 a、an、the 或所有格後通常接名詞。 本題正確答案是 “decision”。

### TOEIC Part 5_6

**題目：** Our _____ of the new branch will begin next week.

- A. inspect
- B. inspection
- C. inspective
- D. inspecting

**目前答案：** B. inspection

**目前分類：** 詞性判斷 / pos-noun

**目前解析：** 冠詞 / 所有格 + 名詞。冠詞 a、an、the 或所有格後通常接名詞。 本題正確答案是 “inspection”。

### TOEIC Part 5_7

**題目：** The updated employee handbook is now _____ online.

- A. availability
- B. avail
- C. available
- D. availably

**目前答案：** C. available

**目前分類：** 詞性判斷 / pos-adjective

**目前解析：** be / seem / become + 形容詞。連綴動詞後常用形容詞說明主語的狀態或特徵。 本題正確答案是 “available”。

### TOEIC Part 5_8

**題目：** Customers were _____ with the speed of the repair service.

- A. satisfaction
- B. satisfy
- C. satisfied
- D. satisfactorily

**目前答案：** C. satisfied

**目前分類：** 詞性判斷 / pos-adjective

**目前解析：** be / seem / become + 形容詞。連綴動詞後常用形容詞說明主語的狀態或特徵。 本題正確答案是 “satisfied”。

### TOEIC Part 5_9

**題目：** The instructions for submitting expenses are _____ and easy to follow.

- A. clarity
- B. clearly
- C. clarify
- D. clear

**目前答案：** D. clear

**目前分類：** 詞性判斷 / pos-adjective

**目前解析：** be / seem / become + 形容詞。連綴動詞後常用形容詞說明主語的狀態或特徵。 本題正確答案是 “clear”。

### TOEIC Part 5_10

**題目：** The annual awards ceremony will be held _____ November 18.

- A. at
- B. on
- C. in
- D. for

**目前答案：** B. on

**目前分類：** 介係詞 / prep-time

**目前解析：** at + 時間點；on + 日期；in + 月份/年份。具體時間點常用 at，日期或星期常用 on，月份、年份或較長期間常用 in。 本題正確答案是 “on”。

### TOEIC Part 5_11

**題目：** The accounting department closes _____ 6:00 P.M. on Fridays.

- A. at
- B. on
- C. in
- D. during

**目前答案：** A. at

**目前分類：** 介係詞 / prep-time

**目前解析：** at + 時間點；on + 日期；in + 月份/年份。具體時間點常用 at，日期或星期常用 on，月份、年份或較長期間常用 in。 本題正確答案是 “at”。

### TOEIC Part 5_12

**題目：** Construction of the new warehouse began _____ 2025.

- A. at
- B. on
- C. in
- D. by

**目前答案：** C. in

**目前分類：** 介係詞 / prep-time

**目前解析：** at + 時間點；on + 日期；in + 月份/年份。具體時間點常用 at，日期或星期常用 on，月份、年份或較長期間常用 in。 本題正確答案是 “in”。

### TOEIC Part 5_13

**題目：** The auditorium has been reserved _____ the product launch.

- A. for
- B. from
- C. with
- D. among

**目前答案：** A. for

**目前分類：** 介係詞 / prep-purpose

**目前解析：** for + 名詞。for 後接名詞時，可以表示目的、用途或對象。 本題正確答案是 “for”。

### TOEIC Part 5_14

**題目：** This discount is available _____ first-time customers.

- A. beside
- B. for
- C. during
- D. upon

**目前答案：** B. for

**目前分類：** 介係詞 / prep-purpose

**目前解析：** for + 名詞。for 後接名詞時，可以表示目的、用途或對象。 本題正確答案是 “for”。

### TOEIC Part 5_15

**題目：** The attached guide provides instructions _____ new employees.

- A. of
- B. at
- C. for
- D. between

**目前答案：** C. for

**目前分類：** 介係詞 / prep-purpose

**目前解析：** for + 名詞。for 後接名詞時，可以表示目的、用途或對象。 本題正確答案是 “for”。

### TOEIC Part 5_16

**題目：** _____ the office was closed, the support team answered calls remotely.

- A. Despite
- B. Although
- C. Because of
- D. Unless

**目前答案：** B. Although

**目前分類：** 連接詞 / conj-contrast

**目前解析：** although + S + V。although 後接完整句子，表示“虽然”；despite 後接名詞。 本題正確答案是 “Although”。

### TOEIC Part 5_17

**題目：** _____ demand was lower than expected, the company met its sales target.

- A. Although
- B. During
- C. Despite
- D. Because of

**目前答案：** A. Although

**目前分類：** 連接詞 / conj-contrast

**目前解析：** although + S + V。although 後接完整句子，表示“虽然”；despite 後接名詞。 本題正確答案是 “Although”。

### TOEIC Part 5_18

**題目：** _____ the printer is inexpensive, it produces high-quality images.

- A. Despite
- B. Although
- C. Since of
- D. In spite

**目前答案：** B. Although

**目前分類：** 連接詞 / conj-contrast

**目前解析：** although + S + V。although 後接完整句子，表示“虽然”；despite 後接名詞。 本題正確答案是 “Although”。

### TOEIC Part 5_19

**題目：** The delivery was delayed _____ a highway had been closed.

- A. because
- B. because of
- C. although
- D. despite

**目前答案：** A. because

**目前分類：** 連接詞 / conj-cause

**目前解析：** because + S + V；because of + 名詞。because 後接完整句子說明原因；because of 後接名詞或名詞短語。 本題正確答案是 “because”。

### TOEIC Part 5_20

**題目：** We extended the registration period _____ many employees requested more time.

- A. yet
- B. because
- C. whereas
- D. unless

**目前答案：** B. because

**目前分類：** 連接詞 / conj-cause

**目前解析：** because + S + V；because of + 名詞。because 後接完整句子說明原因；because of 後接名詞或名詞短語。 本題正確答案是 “because”。


## 台灣學測英文

### 台灣學測英文_1

**題目：** The receptionist greeted every visitor _____.

- A. courteous
- B. courteously
- C. courtesy
- D. courteousness

**目前答案：** B. courteously

**目前分類：** 詞性判斷 / pos-adverb

**目前解析：** 動詞 / 形容詞 + 副詞。副詞用於說明動作如何發生，或修飾形容詞。 本題正確答案是 “courteously”。

### 台灣學測英文_2

**題目：** The revised software operates much more _____ than the previous version.

- A. efficient
- B. efficiency
- C. efficiently
- D. efficiencies

**目前答案：** C. efficiently

**目前分類：** 詞性判斷 / pos-adverb

**目前解析：** 動詞 / 形容詞 + 副詞。副詞用於說明動作如何發生，或修飾形容詞。 本題正確答案是 “efficiently”。

### 台灣學測英文_3

**題目：** Please read the warranty terms _____ before signing the form.

- A. careful
- B. carefully
- C. care
- D. carefulness

**目前答案：** B. carefully

**目前分類：** 詞性判斷 / pos-adverb

**目前解析：** 動詞 / 形容詞 + 副詞。副詞用於說明動作如何發生，或修飾形容詞。 本題正確答案是 “carefully”。

### 台灣學測英文_4

**題目：** Ms. Patel's _____ of the budget helped the team reduce costs.

- A. review
- B. reviewed
- C. reviewing
- D. reviewable

**目前答案：** A. review

**目前分類：** 詞性判斷 / pos-noun

**目前解析：** 冠詞 / 所有格 + 名詞。冠詞 a、an、the 或所有格後通常接名詞。 本題正確答案是 “review”。

### 台灣學測英文_5

**題目：** The committee reached a _____ after reviewing all proposals.

- A. decide
- B. decisive
- C. decision
- D. decisively

**目前答案：** C. decision

**目前分類：** 詞性判斷 / pos-noun

**目前解析：** 冠詞 / 所有格 + 名詞。冠詞 a、an、the 或所有格後通常接名詞。 本題正確答案是 “decision”。

### 台灣學測英文_6

**題目：** Our _____ of the new branch will begin next week.

- A. inspect
- B. inspection
- C. inspective
- D. inspecting

**目前答案：** B. inspection

**目前分類：** 詞性判斷 / pos-noun

**目前解析：** 冠詞 / 所有格 + 名詞。冠詞 a、an、the 或所有格後通常接名詞。 本題正確答案是 “inspection”。

### 台灣學測英文_7

**題目：** The updated employee handbook is now _____ online.

- A. availability
- B. avail
- C. available
- D. availably

**目前答案：** C. available

**目前分類：** 詞性判斷 / pos-adjective

**目前解析：** be / seem / become + 形容詞。連綴動詞後常用形容詞說明主語的狀態或特徵。 本題正確答案是 “available”。

### 台灣學測英文_8

**題目：** Customers were _____ with the speed of the repair service.

- A. satisfaction
- B. satisfy
- C. satisfied
- D. satisfactorily

**目前答案：** C. satisfied

**目前分類：** 詞性判斷 / pos-adjective

**目前解析：** be / seem / become + 形容詞。連綴動詞後常用形容詞說明主語的狀態或特徵。 本題正確答案是 “satisfied”。

### 台灣學測英文_9

**題目：** The instructions for submitting expenses are _____ and easy to follow.

- A. clarity
- B. clearly
- C. clarify
- D. clear

**目前答案：** D. clear

**目前分類：** 詞性判斷 / pos-adjective

**目前解析：** be / seem / become + 形容詞。連綴動詞後常用形容詞說明主語的狀態或特徵。 本題正確答案是 “clear”。

### 台灣學測英文_10

**題目：** The annual awards ceremony will be held _____ November 18.

- A. at
- B. on
- C. in
- D. for

**目前答案：** B. on

**目前分類：** 介係詞 / prep-time

**目前解析：** at + 時間點；on + 日期；in + 月份/年份。具體時間點常用 at，日期或星期常用 on，月份、年份或較長期間常用 in。 本題正確答案是 “on”。

### 台灣學測英文_11

**題目：** The accounting department closes _____ 6:00 P.M. on Fridays.

- A. at
- B. on
- C. in
- D. during

**目前答案：** A. at

**目前分類：** 介係詞 / prep-time

**目前解析：** at + 時間點；on + 日期；in + 月份/年份。具體時間點常用 at，日期或星期常用 on，月份、年份或較長期間常用 in。 本題正確答案是 “at”。

### 台灣學測英文_12

**題目：** Construction of the new warehouse began _____ 2025.

- A. at
- B. on
- C. in
- D. by

**目前答案：** C. in

**目前分類：** 介係詞 / prep-time

**目前解析：** at + 時間點；on + 日期；in + 月份/年份。具體時間點常用 at，日期或星期常用 on，月份、年份或較長期間常用 in。 本題正確答案是 “in”。

### 台灣學測英文_13

**題目：** The auditorium has been reserved _____ the product launch.

- A. for
- B. from
- C. with
- D. among

**目前答案：** A. for

**目前分類：** 介係詞 / prep-purpose

**目前解析：** for + 名詞。for 後接名詞時，可以表示目的、用途或對象。 本題正確答案是 “for”。

### 台灣學測英文_14

**題目：** This discount is available _____ first-time customers.

- A. beside
- B. for
- C. during
- D. upon

**目前答案：** B. for

**目前分類：** 介係詞 / prep-purpose

**目前解析：** for + 名詞。for 後接名詞時，可以表示目的、用途或對象。 本題正確答案是 “for”。

### 台灣學測英文_15

**題目：** The attached guide provides instructions _____ new employees.

- A. of
- B. at
- C. for
- D. between

**目前答案：** C. for

**目前分類：** 介係詞 / prep-purpose

**目前解析：** for + 名詞。for 後接名詞時，可以表示目的、用途或對象。 本題正確答案是 “for”。

### 台灣學測英文_16

**題目：** _____ the office was closed, the support team answered calls remotely.

- A. Despite
- B. Although
- C. Because of
- D. Unless

**目前答案：** B. Although

**目前分類：** 連接詞 / conj-contrast

**目前解析：** although + S + V。although 後接完整句子，表示“虽然”；despite 後接名詞。 本題正確答案是 “Although”。

### 台灣學測英文_17

**題目：** _____ demand was lower than expected, the company met its sales target.

- A. Although
- B. During
- C. Despite
- D. Because of

**目前答案：** A. Although

**目前分類：** 連接詞 / conj-contrast

**目前解析：** although + S + V。although 後接完整句子，表示“虽然”；despite 後接名詞。 本題正確答案是 “Although”。

### 台灣學測英文_18

**題目：** _____ the printer is inexpensive, it produces high-quality images.

- A. Despite
- B. Although
- C. Since of
- D. In spite

**目前答案：** B. Although

**目前分類：** 連接詞 / conj-contrast

**目前解析：** although + S + V。although 後接完整句子，表示“虽然”；despite 後接名詞。 本題正確答案是 “Although”。

### 台灣學測英文_19

**題目：** The delivery was delayed _____ a highway had been closed.

- A. because
- B. because of
- C. although
- D. despite

**目前答案：** A. because

**目前分類：** 連接詞 / conj-cause

**目前解析：** because + S + V；because of + 名詞。because 後接完整句子說明原因；because of 後接名詞或名詞短語。 本題正確答案是 “because”。

### 台灣學測英文_20

**題目：** We extended the registration period _____ many employees requested more time.

- A. yet
- B. because
- C. whereas
- D. unless

**目前答案：** B. because

**目前分類：** 連接詞 / conj-cause

**目前解析：** because + S + V；because of + 名詞。because 後接完整句子說明原因；because of 後接名詞或名詞短語。 本題正確答案是 “because”。


## 台灣教育會考英文

### 台灣教育會考英文_1

**題目：** The receptionist greeted every visitor _____.

- A. courteous
- B. courteously
- C. courtesy
- D. courteousness

**目前答案：** B. courteously

**目前分類：** 詞性判斷 / pos-adverb

**目前解析：** 動詞 / 形容詞 + 副詞。副詞用於說明動作如何發生，或修飾形容詞。 本題正確答案是 “courteously”。

### 台灣教育會考英文_2

**題目：** The revised software operates much more _____ than the previous version.

- A. efficient
- B. efficiency
- C. efficiently
- D. efficiencies

**目前答案：** C. efficiently

**目前分類：** 詞性判斷 / pos-adverb

**目前解析：** 動詞 / 形容詞 + 副詞。副詞用於說明動作如何發生，或修飾形容詞。 本題正確答案是 “efficiently”。

### 台灣教育會考英文_3

**題目：** Please read the warranty terms _____ before signing the form.

- A. careful
- B. carefully
- C. care
- D. carefulness

**目前答案：** B. carefully

**目前分類：** 詞性判斷 / pos-adverb

**目前解析：** 動詞 / 形容詞 + 副詞。副詞用於說明動作如何發生，或修飾形容詞。 本題正確答案是 “carefully”。

### 台灣教育會考英文_4

**題目：** Ms. Patel's _____ of the budget helped the team reduce costs.

- A. review
- B. reviewed
- C. reviewing
- D. reviewable

**目前答案：** A. review

**目前分類：** 詞性判斷 / pos-noun

**目前解析：** 冠詞 / 所有格 + 名詞。冠詞 a、an、the 或所有格後通常接名詞。 本題正確答案是 “review”。

### 台灣教育會考英文_5

**題目：** The committee reached a _____ after reviewing all proposals.

- A. decide
- B. decisive
- C. decision
- D. decisively

**目前答案：** C. decision

**目前分類：** 詞性判斷 / pos-noun

**目前解析：** 冠詞 / 所有格 + 名詞。冠詞 a、an、the 或所有格後通常接名詞。 本題正確答案是 “decision”。

### 台灣教育會考英文_6

**題目：** Our _____ of the new branch will begin next week.

- A. inspect
- B. inspection
- C. inspective
- D. inspecting

**目前答案：** B. inspection

**目前分類：** 詞性判斷 / pos-noun

**目前解析：** 冠詞 / 所有格 + 名詞。冠詞 a、an、the 或所有格後通常接名詞。 本題正確答案是 “inspection”。

### 台灣教育會考英文_7

**題目：** The updated employee handbook is now _____ online.

- A. availability
- B. avail
- C. available
- D. availably

**目前答案：** C. available

**目前分類：** 詞性判斷 / pos-adjective

**目前解析：** be / seem / become + 形容詞。連綴動詞後常用形容詞說明主語的狀態或特徵。 本題正確答案是 “available”。

### 台灣教育會考英文_8

**題目：** Customers were _____ with the speed of the repair service.

- A. satisfaction
- B. satisfy
- C. satisfied
- D. satisfactorily

**目前答案：** C. satisfied

**目前分類：** 詞性判斷 / pos-adjective

**目前解析：** be / seem / become + 形容詞。連綴動詞後常用形容詞說明主語的狀態或特徵。 本題正確答案是 “satisfied”。

### 台灣教育會考英文_9

**題目：** The instructions for submitting expenses are _____ and easy to follow.

- A. clarity
- B. clearly
- C. clarify
- D. clear

**目前答案：** D. clear

**目前分類：** 詞性判斷 / pos-adjective

**目前解析：** be / seem / become + 形容詞。連綴動詞後常用形容詞說明主語的狀態或特徵。 本題正確答案是 “clear”。

### 台灣教育會考英文_10

**題目：** The annual awards ceremony will be held _____ November 18.

- A. at
- B. on
- C. in
- D. for

**目前答案：** B. on

**目前分類：** 介係詞 / prep-time

**目前解析：** at + 時間點；on + 日期；in + 月份/年份。具體時間點常用 at，日期或星期常用 on，月份、年份或較長期間常用 in。 本題正確答案是 “on”。

### 台灣教育會考英文_11

**題目：** The accounting department closes _____ 6:00 P.M. on Fridays.

- A. at
- B. on
- C. in
- D. during

**目前答案：** A. at

**目前分類：** 介係詞 / prep-time

**目前解析：** at + 時間點；on + 日期；in + 月份/年份。具體時間點常用 at，日期或星期常用 on，月份、年份或較長期間常用 in。 本題正確答案是 “at”。

### 台灣教育會考英文_12

**題目：** Construction of the new warehouse began _____ 2025.

- A. at
- B. on
- C. in
- D. by

**目前答案：** C. in

**目前分類：** 介係詞 / prep-time

**目前解析：** at + 時間點；on + 日期；in + 月份/年份。具體時間點常用 at，日期或星期常用 on，月份、年份或較長期間常用 in。 本題正確答案是 “in”。

### 台灣教育會考英文_13

**題目：** The auditorium has been reserved _____ the product launch.

- A. for
- B. from
- C. with
- D. among

**目前答案：** A. for

**目前分類：** 介係詞 / prep-purpose

**目前解析：** for + 名詞。for 後接名詞時，可以表示目的、用途或對象。 本題正確答案是 “for”。

### 台灣教育會考英文_14

**題目：** This discount is available _____ first-time customers.

- A. beside
- B. for
- C. during
- D. upon

**目前答案：** B. for

**目前分類：** 介係詞 / prep-purpose

**目前解析：** for + 名詞。for 後接名詞時，可以表示目的、用途或對象。 本題正確答案是 “for”。

### 台灣教育會考英文_15

**題目：** The attached guide provides instructions _____ new employees.

- A. of
- B. at
- C. for
- D. between

**目前答案：** C. for

**目前分類：** 介係詞 / prep-purpose

**目前解析：** for + 名詞。for 後接名詞時，可以表示目的、用途或對象。 本題正確答案是 “for”。

### 台灣教育會考英文_16

**題目：** _____ the office was closed, the support team answered calls remotely.

- A. Despite
- B. Although
- C. Because of
- D. Unless

**目前答案：** B. Although

**目前分類：** 連接詞 / conj-contrast

**目前解析：** although + S + V。although 後接完整句子，表示“虽然”；despite 後接名詞。 本題正確答案是 “Although”。

### 台灣教育會考英文_17

**題目：** _____ demand was lower than expected, the company met its sales target.

- A. Although
- B. During
- C. Despite
- D. Because of

**目前答案：** A. Although

**目前分類：** 連接詞 / conj-contrast

**目前解析：** although + S + V。although 後接完整句子，表示“虽然”；despite 後接名詞。 本題正確答案是 “Although”。

### 台灣教育會考英文_18

**題目：** _____ the printer is inexpensive, it produces high-quality images.

- A. Despite
- B. Although
- C. Since of
- D. In spite

**目前答案：** B. Although

**目前分類：** 連接詞 / conj-contrast

**目前解析：** although + S + V。although 後接完整句子，表示“虽然”；despite 後接名詞。 本題正確答案是 “Although”。

### 台灣教育會考英文_19

**題目：** The delivery was delayed _____ a highway had been closed.

- A. because
- B. because of
- C. although
- D. despite

**目前答案：** A. because

**目前分類：** 連接詞 / conj-cause

**目前解析：** because + S + V；because of + 名詞。because 後接完整句子說明原因；because of 後接名詞或名詞短語。 本題正確答案是 “because”。

### 台灣教育會考英文_20

**題目：** We extended the registration period _____ many employees requested more time.

- A. yet
- B. because
- C. whereas
- D. unless

**目前答案：** B. because

**目前分類：** 連接詞 / conj-cause

**目前解析：** because + S + V；because of + 名詞。because 後接完整句子說明原因；because of 後接名詞或名詞短語。 本題正確答案是 “because”。

