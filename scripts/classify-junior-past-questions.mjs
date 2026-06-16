import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "data", "questions_junior_past.json");
const payload = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));

const explicit = {
  JUNIOR_PAST_105_09: ["Grammar", "主謂一致", "動名詞當主詞"],
  JUNIOR_PAST_109_15: ["Grammar", "比較級", "最高級／the least"],
  JUNIOR_PAST_113_16: ["Reading", "推論", "語氣線索"],
  JUNIOR_PAST_114_10: ["Grammar", "時態", "現在進行式表示未來"],
  JUNIOR_PAST_115_07: ["Vocabulary", "字義", "形容詞語意判斷"],
};

const prepositions = new Set(["in", "on", "at", "for", "from", "with", "of", "by", "above", "below", "between", "among", "through", "during", "without", "into", "over", "under", "beside", "besides"]);
const pronouns = new Set(["i", "me", "mine", "myself", "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "one", "ones", "another", "the other"]);
const auxiliaries = /^(am|is|are|was|were|be|been|being|has|have|had|do|does|did|will|would|can|could|may|might|must|should)(\s+\w+)?$/;
const endings = /(tion|sion|ment|ness|ity|ance|ence|ship|ous|ful|less|ive|able|ible|al|ic|ary|ory|ly)$/;

function sameWordFamily(options) {
  const roots = options.map((x) => x.replace(endings, "").replace(/(ed|ing|s)$/, ""));
  return new Set(roots).size <= 2;
}

function classify(q) {
  if (explicit[q.id]) {
    return { values: explicit[q.id], reason: "已人工確認", confidence: "high" };
  }

  const text = q.question.toLowerCase();
  const options = q.options.map((x) => x.toLowerCase().trim().replace(/[.?!]$/, ""));
  const sentenceCount = (q.question.match(/[.!?](?:\s|$)/g) || []).length;

  if (options.every((x) => prepositions.has(x))) {
    return { values: ["Vocabulary", "介系詞搭配", ""], reason: "選項都是介系詞，需依搭配與語意判斷", confidence: "high" };
  }
  if (options.every((x) => pronouns.has(x))) {
    return { values: ["Grammar", "代名詞", ""], reason: "選項都是代名詞形式", confidence: "high" };
  }
  if (options.some((x) => /^(who|which|whose|whom|that)\b/.test(x))) {
    return { values: ["Grammar", "關係代名詞", ""], reason: "選項比較關係代名詞結構", confidence: "high" };
  }
  if (options.some((x) => /\b(most|least|more|less|better|worse|best|worst)\b/.test(x)) || /\bthan\b/.test(text)) {
    return { values: ["Grammar", "比較級", ""], reason: "選項或題幹有明確比較結構", confidence: "high" };
  }
  if (options.some((x) => /^to\s+\w+/.test(x)) && options.some((x) => /\w+ing$/.test(x))) {
    return { values: ["Grammar", "不定詞", "不定詞／動名詞辨析"], reason: "選項直接比較 to V 與 V-ing", confidence: "high" };
  }
  if (options.some((x) => /^to\s+\w+/.test(x)) && options.some((x) => /^[a-z]+$/.test(x))) {
    return { values: ["Grammar", "不定詞", ""], reason: "選項直接比較 to V 與其他動詞形式", confidence: "high" };
  }
  if (options.some((x) => /\w+ing$/.test(x)) && options.some((x) => /^(to\s+)?\w+$/.test(x))) {
    return { values: ["Grammar", "動名詞", ""], reason: "選項直接比較 V-ing 與其他動詞形式", confidence: "high" };
  }
  if (options.every((x) => auxiliaries.test(x) || /^(am|is|are|was|were|has|have|had|will|would)\s+\w+/.test(x))) {
    return { values: ["Grammar", "時態", ""], reason: "選項比較助動詞或不同時態形式", confidence: "high" };
  }
  if (sameWordFamily(options)) {
    return { values: ["Vocabulary", "字義", "詞形語意判斷"], reason: "選項為同一詞族的不同形式，需回到句意判斷", confidence: "medium" };
  }
  if (sentenceCount >= 2 || /\b(so|because|but|however|you can.?t tell|this means)\b/.test(text)) {
    return { values: ["Reading", "情境判斷", "上下文線索"], reason: "答案需要依後句或上下文線索推論", confidence: "medium" };
  }
  if (options.some((x) => /\s/.test(x))) {
    return { values: ["Vocabulary", "片語", ""], reason: "選項含片語，主要比較搭配與語意", confidence: "medium" };
  }
  if (options.every((x) => /^[a-z'-]+$/.test(x))) {
    return { values: ["Vocabulary", "字義", ""], reason: "選項都是單字，主要依句意選詞", confidence: "medium" };
  }
  return { values: ["Unclassified", "待分類審核", ""], reason: "規則證據不足", confidence: "low" };
}

const slug = (value) => String(value || "general")
  .toLowerCase()
  .replace(/\s+/g, "-")
  .replace(/[／/]+/g, "-")
  .replace(/[^\p{Script=Han}a-z0-9-]+/gu, "")
  .replace(/-+/g, "-")
  .replace(/^-+|-+$/g, "");

for (const q of payload.questions) {
  const result = classify(q);
  const manuallyConfirmed = Boolean(explicit[q.id]);
  const [domain, point, secondaryPoint] = result.values;

  q.questionType = domain;
  q.domain = domain;
  q.knowledgePoint = point;
  q.secondaryPoint = secondaryPoint || "";
  q.knowledgeCategory = secondaryPoint ? `${point}／${secondaryPoint}` : point;
  q.category = [domain, point, secondaryPoint].filter(Boolean).join("／");
  q.knowledge_id = `junior-past-${slug(domain)}-${slug(point)}${secondaryPoint ? `-${slug(secondaryPoint)}` : ""}`;
  q.classification = {
    domain,
    knowledgePoint: point,
    secondaryPoint: secondaryPoint || "",
    confidence: result.confidence,
    reason: result.reason,
  };
  q.classification_status = manuallyConfirmed ? "confirmed" : "needs_review";
  q.analysis_ready = manuallyConfirmed;

  if (!q.analysis_ready) {
    delete q.analysis;
    q.explanation = "";
  }
}

fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

const reviewDir = path.join(root, "review");
fs.mkdirSync(reviewDir, { recursive: true });
fs.writeFileSync(
  path.join(reviewDir, "junior-classification-review.json"),
  `${JSON.stringify(payload.questions.map((q) => ({
    id: q.id,
    year: q.year,
    questionNo: q.questionNo,
    question: q.question,
    options: q.options,
    answerLetter: q.answerLetter,
    proposedClassification: q.classification,
    classification_status: q.classification_status,
  })), null, 2)}\n`,
  "utf8",
);

const summary = {};
for (const q of payload.questions) {
  const key = `${q.domain}/${q.knowledgePoint}/${q.secondaryPoint || "-"}:${q.classification_status}`;
  summary[key] = (summary[key] || 0) + 1;
}
console.log(JSON.stringify(summary, null, 2));
