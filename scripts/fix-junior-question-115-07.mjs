import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "data", "questions_junior_past.json");
const payload = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
const q = payload.questions.find((item) => item.year === 115 && item.questionNo === 7);
if (!q) throw new Error("JUNIOR_PAST_115_07 not found");

q.questionType = "Vocabulary";
q.domain = "Vocabulary";
q.knowledgePoint = "字義";
q.secondaryPoint = "形容詞語意判斷";
q.knowledge_id = "junior-past-vocabulary-字義-形容詞語意判斷";
q.knowledgeCategory = "字義／形容詞語意判斷";
q.category = "Vocabulary／字義／形容詞語意判斷";
q.classification = { domain: "Vocabulary", knowledgePoint: "字義", secondaryPoint: "形容詞語意判斷", confidence: "high", reason: "已人工確認：get/got + 形容詞，依情境判斷腿的狀態" };
q.classification_status = "confirmed";
q.analysis_ready = true;
q.knowledgeTags = ["字義", "形容詞語意", "get + 形容詞"];
q.sentence_translation = "爬了四個小時的山後，Rosa 的腿變得痠痛，所以她在山頂休息了一下。";
q.translation_source = "user_confirmed";
q.translation_verified = true;
q.analysis = {
  focus: "本題考形容詞語意判斷。空格前是 got，這裡表示「變得……」，後面需要接形容詞，描述 Rosa 的腿爬山四小時後的狀態。",
  correct_reason: "sore 表示「痠痛的」。After four hours of mountain climbing 表示爬山四小時後，腿變痠痛，所以需要休息。",
  common_trap: "看到 get/got + 形容詞，要判斷主詞「變成什麼狀態」。再看前後文情境選最合理的形容詞。",
  option_reasons: {
    dirty: "dirty 是「髒的」，和爬山後需要休息的原因不直接相關。",
    sick: "sick 是「生病的」，通常形容人身體不舒服，不自然用來形容 legs。",
    strong: "strong 是「強壯的」，和後面 took a rest 的語意相反。",
  },
};
q.explanation = `${q.analysis.focus} ${q.analysis.correct_reason} ${q.analysis.common_trap}`;

fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log("Fixed JUNIOR_PAST_115_07");
