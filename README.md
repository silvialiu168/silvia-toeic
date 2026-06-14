# Family English Challenge

家庭共用英语练习平台。V1 已包含家庭 Dashboard、三位学习者独立资料、文法练习、单字练习、错题本、成长统计、PWA 安装与离线缓存。阅读中心目前保留扩充框架。

## 本地打开

不要直接双击 `index.html`，资料文件可能无法载入。请在本目录启动本地网页服务，再打开：

`http://127.0.0.1:8765/`

## 手机安装与离线使用

1. 将网站部署到支持 HTTPS 的网址，例如 GitHub Pages。
2. 手机先联网打开一次网站，等待页面与题库载入。
3. Android Chrome：菜单中选择「安装应用程式」或「加到主画面」。
4. iPhone Safari：点分享按钮，选择「加入主画面」。
5. 完成首次载入后，已缓存的页面、文法、单字与阅读资料可以离线打开。

学习记录保存在每台装置的浏览器中。清除浏览器资料会清除该装置上的学习记录。

## 资料文件

- `data/users.json`：学习者、目标、阶段与各自储存名称。
- `data/knowledge_common.json`：三人共用知识点。
- `data/knowledge_toeic.json`：TOEIC 专属知识点。
- `data/knowledge_gsat.json`：学测专属知识点。
- `data/knowledge_junior.json`：会考专属知识点。
- `data/questions_toeic.json`：Silvia 文法题。
- `data/questions_gsat.json`：Ray 文法题。
- `data/questions_junior.json`：Sean 文法题。
- `data/vocab_toeic.json`：TOEIC 单字。
- `data/vocab_gsat.json`：学测单字。
- `data/vocab_junior.json`：会考单字。
- `data/reading_*.json`：阅读中心资料，V1 暂未启用。

## 新增知识点

在对应的 `knowledge_*.json` 加入一笔资料。每个知识点至少填写：

`id`、`category`、`formula`、`rule`、`example`、`translation`、`common_error`、`tags`

`id` 必须唯一。题目的 `knowledge_id` 必须与这个 `id` 完全相同，系统才会自动统计熟悉度。

## 新增文法题

在对应的 `questions_*.json` 加入一笔资料：

`id`、`question`、`options`、`answer`、`explanation`、`knowledge_id`、`category`

`answer` 使用选项位置，从 `0` 开始。例如正确答案是第二个选项时填写 `1`。

## 新增单字

在对应的 `vocab_*.json` 加入一笔资料：

`id`、`word`、`level`、`part_of_speech`、`chinese`、`simple_definition`、`word_family`、`forms`、`examples`、`common_collocations`、`common_error`、`tags`

`forms` 请填写 `base`、`third_person`、`past`、`past_participle`、`ing`。系统会自动用这些资料生成五种单字练习。

## 新增阅读资料

未来在对应的 `reading_*.json` 加入文章与题目即可。阅读中心目前仅显示框架，正式启用时不需要改变其他资料文件的命名。
