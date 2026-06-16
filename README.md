# Family English Challenge

家庭共用英語練習平台。V1 已包含家庭 Dashboard、三位學習者独立資料、文法練習、單字練習、錯題本、成長统計、PWA 安裝與離線缓存。閱讀中心目前保留擴充框架。

## 本地打開

不要直接双击 `index.html`，資料檔案可能無法载入。请在本目錄启動本地網頁服務，再打開：

`http://127.0.0.1:8765/`

## 手机安裝與離線使用

1. 將網站部署到支持 HTTPS 的網址，例如 GitHub Pages。
2. 手机先聯網打開一次網站，等待頁面與題庫载入。
3. Android Chrome：菜單中選擇「安裝應用程式」或「加到主画面」。
4. iPhone Safari：點分享按钮，選擇「加入主画面」。
5. 完成首次载入後，已缓存的頁面、文法、單字與閱讀資料可以離線打開。

學習記錄保存在每台装置的浏览器中。清除浏览器資料會清除该装置上的學習記錄。

## 資料檔案

- `data/users.json`：學習者、目標、階段與各自儲存名称。
- `data/knowledge_common.json`：三人共用知識點。
- `data/knowledge_toeic.json`：TOEIC 專属知識點。
- `data/knowledge_gsat.json`：學測專属知識點。
- `data/knowledge_junior.json`：會考專属知識點。
- `data/questions_toeic.json`：Silvia 文法題。
- `data/questions_gsat.json`：Ray 文法題。
- `data/questions_junior.json`：Sean 文法題。
- `data/questions_junior_past.json`：Sean 會考歷屆真題單題，包含年份、題號、英語閱讀答案與知識點。
- `data/past_papers_junior.json`：111～115 年會考閱讀試題來源與英語閱讀答案索引。
- `data/vocab_toeic.json`：TOEIC 單字。
- `data/vocab_gsat.json`：學測單字。
- `data/vocab_junior.json`：會考單字。
- `data/reading_*.json`：閱讀中心資料，V1 暂未启用。

## 新增知識點

在对應的 `knowledge_*.json` 加入一笔資料。每個知識點至少填写：

`id`、`category`、`formula`、`rule`、`example`、`translation`、`common_error`、`tags`

`id` 必须唯一。題目的 `knowledge_id` 必须與這個 `id` 完全相同，系統才會自動统計熟悉度。

## 新增文法題

在对應的 `questions_*.json` 加入一笔資料：

`id`、`question`、`options`、`answer`、`explanation`、`knowledgePoint`、`category`

`answer` 使用選項位置，從 `0` 開始。例如正確答案是第二個選項時填写 `1`。

`knowledgePoint` 必須對應知識庫中的 `id`。系統仍相容舊欄位 `knowledge_id`，但新增題目請統一使用 `knowledgePoint`。

每個知識點至少建立 5 題。可執行 `scripts/audit-grammar-bank.ps1` 檢查題數、覆蓋率與錯誤綁定。擴充目標記錄在 `data/grammar_expansion_plan.json`。

## 新增單字

在对應的 `vocab_*.json` 加入一笔資料：

`id`、`word`、`level`、`part_of_speech`、`chinese`、`simple_definition`、`word_family`、`forms`、`examples`、`common_collocations`、`common_error`、`tags`

`forms` 请填写 `base`、`third_person`、`past`、`past_participle`、`ing`。系統會自動用這些資料生成五种單字練習。

## 新增閱讀資料

未来在对應的 `reading_*.json` 加入文章與題目即可。閱讀中心目前仅顯示框架，正式启用時不需要改变其他資料檔案的命名。




