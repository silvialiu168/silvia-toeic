import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "data", "questions_junior_past.json");
const payload = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
const q = payload.questions.find((item) => item.year === 114 && item.questionNo === 10);
if (!q) throw new Error("JUNIOR_PAST_114_10 not found");

q.questionType = "Grammar";
q.domain = "Grammar";
q.knowledgePoint = "時態";
q.secondaryPoint = "現在進行式表示未來";
q.knowledge_id = "junior-past-grammar-時態-現在進行式表示未來";
q.knowledgeCategory = "時態／現在進行式表示未來";
q.category = "Grammar／時態／現在進行式表示未來";
q.classification = { domain: "Grammar", knowledgePoint: "時態", secondaryPoint: "現在進行式表示未來", confidence: "high", reason: "已人工確認：be coming 表示即將到來" };
q.classification_status = "confirmed";
q.analysis_ready = true;
q.knowledgeTags = ["現在進行式", "未來安排", "be coming"];
q.sentence_translation = "聖誕節快到了，我想去國外拜訪阿姨。你已經有任何計畫了嗎？";
q.translation_source = "user_confirmed";
q.translation_verified = true;
q.analysis = {
  focus: "本題考現在進行式用來表示即將發生的事情。Christmas is coming 是常見說法，意思是「聖誕節快到了」。",
  correct_reason: "後面說 I want to visit my aunt abroad. Do you have any plans yet? 表示說話者正在談即將到來的假期計畫，所以用 is coming 表示 Christmas 即將到來。",
  common_trap: "看到節日、活動或時間點快到了，且句子在談未來計畫，可以用 be coming 表示「即將到來」。",
  option_reasons: {
    came: "came 是過去式，表示已經來過，不符合後面還在問計畫的語境。",
    comes: "comes 是一般現在式，可表示固定事實；但這裡正在談即將到來的節日與計畫，用 is coming 較自然。",
    "was coming": "was coming 是過去進行式，表示過去某個時間正在接近，不符合現在談未來計畫的語境。",
  },
};
q.explanation = `${q.analysis.focus} ${q.analysis.correct_reason} ${q.analysis.common_trap}`;

fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log("Fixed JUNIOR_PAST_114_10");
