import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "data", "questions_junior_past.json");
const payload = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
const q = payload.questions.find((item) => item.year === 113 && item.questionNo === 16);
if (!q) throw new Error("JUNIOR_PAST_113_16 not found");

q.questionType = "Reading";
q.domain = "Reading";
q.knowledgePoint = "推論";
q.secondaryPoint = "語氣線索";
q.knowledge_id = "junior-past-reading-推論-語氣線索";
q.knowledgeCategory = "推論／語氣線索";
q.category = "Reading／推論／語氣線索";
q.classification = { domain: "Reading", knowledgePoint: "推論", secondaryPoint: "語氣線索", confidence: "high", reason: "已人工確認：需依後句線索推論" };
q.classification_status = "confirmed";
q.analysis_ready = true;
q.sentence_translation = "服務台的新同事接電話時像個機器人。他的聲音沒有高低起伏，你聽不出他是開心還是難過。";
q.translation_source = "user_confirmed";
q.translation_verified = true;
q.analysis = {
  focus: "本題考閱讀理解與語意推論。答案不能只看空格前面，要讀後面給的聲音線索。",
  correct_reason: "There are no ups and downs in his voice 表示聲音沒有抑揚頓挫；you can't tell if he is happy or sad 表示聽不出情緒。robot 最符合單調、機械、沒有情緒變化的說話方式。",
  common_trap: "遇到後面有補充說明的題目，先把後句當成證據，再選最符合全部線索的答案。",
  option_reasons: {
    father: "father 是爸爸，爸爸說話不一定沒有感情，無法解釋聲音沒有起伏。",
    foreigner: "foreigner 是外國人，外國人說話也可能很有感情，不能由後句線索推出。",
    radio: "radio 是收音機或廣播，廣播通常會有語調變化，也不符合聽不出情緒的描述。",
  },
};
q.explanation = `${q.analysis.focus} ${q.analysis.correct_reason} ${q.analysis.common_trap}`;

fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log("Fixed JUNIOR_PAST_113_16");
