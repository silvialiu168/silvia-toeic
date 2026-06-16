import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "data", "questions_junior_past.json");
const payload = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
const fixes = [];

for (const q of payload.questions) {
  q.options = q.options.map((option, index) => {
    if (index !== 3) return option;
    const original = option;
    let cleaned = option.replace(/\s+\d+\s*$/, "").trim();
    cleaned = cleaned.replace(/\s+\d+\s+\d+\s*\.\s+I\s+t\s+was\b.*$/i, "").trim();
    if (cleaned !== original) fixes.push({ id: q.id, original, cleaned });
    return cleaned;
  });
}

const q = payload.questions.find((item) => item.year === 109 && item.questionNo === 15);
if (!q) throw new Error("JUNIOR_PAST_109_15 not found");

q.questionType = "Grammar";
q.domain = "Grammar";
q.knowledgePoint = "比較級";
q.secondaryPoint = "最高級／the least";
q.knowledge_id = "junior-past-grammar-比較級-最高級-the-least";
q.knowledgeCategory = "比較級／最高級／the least";
q.category = "Grammar／比較級／最高級／the least";
q.classification = { domain: "Grammar", knowledgePoint: "比較級", secondaryPoint: "最高級／the least", confidence: "high", reason: "已人工確認：the least important 表示最不重要" };
q.classification_status = "confirmed";
q.analysis_ready = true;
q.knowledgeTags = ["比較級", "最高級", "the least", "語意判斷"];
q.sentence_translation = "對 Mike 來說，買牛仔褲時價格是最不重要的事情；他更在意口袋的形狀和大小。";
q.translation_source = "user_confirmed";
q.translation_verified = true;
q.analysis = {
  focus: "本題考最高級的語意判斷。the least important 表示「最不重要的」。",
  correct_reason: "後面說 He cares even more about the shape and the size of the pockets，表示 Mike 更在意口袋的形狀和大小，所以價格是最不重要的事，應選 the least。",
  common_trap: "看到 important 不要直接選 the most。要讀後一句，判斷前後比較出來的真正語意。",
  option_reasons: {
    "the more": "the more 是比較級，通常需要比較對象或搭配 the more..., the more...，不能表示「最不重要」。",
    "the most": "the most important 表示「最重要的」，但後句說 Mike 更在意口袋形狀和大小，語意不合。",
    "the less": "the less 是比較級，表示「比較不重要」，但題目是在多個考量中指出最不重要的一項。",
  },
};
q.explanation = `${q.analysis.focus} ${q.analysis.correct_reason} ${q.analysis.common_trap}`;

fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ cleaned: fixes.length, fixes }, null, 2));
