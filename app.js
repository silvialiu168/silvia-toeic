const categories = [
  "词性判断",
  "前置词",
  "连接词",
  "时间副词子句",
  "主谓一致",
  "关系代名词",
  "固定搭配",
  "商务词汇"
];

const categoryWeights = {
  "词性判断": 18,
  "前置词": 12,
  "连接词": 12,
  "时间副词子句": 10,
  "主谓一致": 12,
  "关系代名词": 12,
  "固定搭配": 14,
  "商务词汇": 10
};

const state = {
  questions: [],
  knowledge: {},
  filteredQuestions: [],
  currentIndex: 0,
  currentQuestion: null,
  recentQuestionIds: [],
  locked: false,
  mode: "all",
  progress: loadProgress()
};

const elements = {
  totalCount: document.querySelector("#totalCount"),
  answeredCount: document.querySelector("#answeredCount"),
  accuracy: document.querySelector("#accuracy"),
  mistakeCount: document.querySelector("#mistakeCount"),
  categorySelect: document.querySelector("#categorySelect"),
  allQuestionsButton: document.querySelector("#allQuestionsButton"),
  mistakesButton: document.querySelector("#mistakesButton"),
  weakButton: document.querySelector("#weakButton"),
  clearMistakesButton: document.querySelector("#clearMistakesButton"),
  installButton: document.querySelector("#installButton"),
  connectionStatus: document.querySelector("#connectionStatus"),
  masteryPercent: document.querySelector("#masteryPercent"),
  masteryBar: document.querySelector("#masteryBar"),
  masteryList: document.querySelector("#masteryList"),
  categoryDashboard: document.querySelector("#categoryDashboard"),
  weakestList: document.querySelector("#weakestList"),
  questionCount: document.querySelector("#questionCount"),
  loadingState: document.querySelector("#loadingState"),
  errorState: document.querySelector("#errorState"),
  quizCard: document.querySelector("#quizCard"),
  categoryBadge: document.querySelector("#categoryBadge"),
  progressText: document.querySelector("#progressText"),
  questionText: document.querySelector("#questionText"),
  options: document.querySelector("#options"),
  feedback: document.querySelector("#feedback"),
  resultBanner: document.querySelector("#resultBanner"),
  showExplanationButton: document.querySelector("#showExplanationButton"),
  explanationPanel: document.querySelector("#explanationPanel"),
  explanation: document.querySelector("#explanation"),
  knowledgeFormula: document.querySelector("#knowledgeFormula"),
  knowledgeRule: document.querySelector("#knowledgeRule"),
  knowledgeExample: document.querySelector("#knowledgeExample"),
  knowledgeTranslation: document.querySelector("#knowledgeTranslation"),
  knowledgeError: document.querySelector("#knowledgeError"),
  knowledgeTags: document.querySelector("#knowledgeTags"),
  nextButton: document.querySelector("#nextButton")
};

async function loadData() {
  try {
    const [questionsResponse, knowledgeResponse] = await Promise.all([
      fetch("questions.json"),
      fetch("knowledge.json")
    ]);

    if (!questionsResponse.ok || !knowledgeResponse.ok) {
      throw new Error("资料文件读取失败");
    }

    state.questions = await questionsResponse.json();
    const knowledgeItems = await knowledgeResponse.json();
    state.knowledge = Object.fromEntries(knowledgeItems.map((item) => [item.id, item]));

    populateCategories();
    startPractice("全部");
    elements.loadingState.classList.add("hidden");
    elements.quizCard.classList.remove("hidden");
  } catch (error) {
    elements.loadingState.classList.add("hidden");
    elements.errorState.classList.remove("hidden");
    elements.errorState.innerHTML =
      "<strong>无法载入练习资料。</strong><br>请通过本地服务器打开本页面，不要直接双击 index.html。";
  }
}

function populateCategories() {
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    elements.categorySelect.appendChild(option);
  });
}

function startPractice(category) {
  const categoryQuestions = category === "全部"
    ? [...state.questions]
    : state.questions.filter((question) => question.category === category);
  state.filteredQuestions = state.mode === "mistakes"
    ? categoryQuestions.filter((question) => state.progress.mistakes[question.id])
    : state.mode === "weak"
      ? categoryQuestions.filter((question) => getWeakKnowledgeIds().includes(question.knowledge_id || question.knowledgeId))
    : categoryQuestions;
  state.currentIndex = 0;
  state.recentQuestionIds = [];
  state.locked = false;
  updateStats();
  renderPracticeState();
}

function renderPracticeState() {
  if (state.filteredQuestions.length === 0) {
    elements.quizCard.classList.add("hidden");
    elements.errorState.classList.remove("hidden");
    elements.errorState.textContent = state.mode === "mistakes"
      ? "目前没有符合此分类的错题。答错的题目会自动加入错题本。"
      : state.mode === "weak"
        ? "目前还没有可判断的薄弱知识点，请先完成一些练习。"
        : "此分类目前没有题目。";
    elements.questionCount.textContent = "共 0 题";
    return;
  }
  elements.errorState.classList.add("hidden");
  elements.quizCard.classList.remove("hidden");
  renderQuestion();
}

function renderQuestion() {
  const question = state.mode === "all" || state.mode === "weak"
    ? chooseSmartQuestion()
    : state.filteredQuestions[state.currentIndex];
  state.currentQuestion = question;
  state.locked = false;

  elements.categoryBadge.textContent = question.category;
  elements.progressText.textContent = state.mode === "all"
    ? "智能练习"
    : `第 ${state.currentIndex + 1} / ${state.filteredQuestions.length} 题`;
  elements.questionCount.textContent = `本分类共 ${state.filteredQuestions.length} 题`;
  elements.questionText.textContent = question.question;
  elements.options.replaceChildren();
  elements.feedback.classList.add("hidden");
  elements.explanationPanel.classList.add("hidden");
  elements.showExplanationButton.textContent = "查看解析";
  elements.nextButton.disabled = true;
  elements.nextButton.textContent = "下一题";

  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    button.dataset.index = index;
    button.innerHTML = `<span class="option-label">${String.fromCharCode(65 + index)}</span><span>${option}</span>`;
    button.addEventListener("click", () => selectAnswer(index));
    elements.options.appendChild(button);
  });
}

function selectAnswer(selectedIndex) {
  if (state.locked) return;

  state.locked = true;
  const question = state.currentQuestion;
  const isCorrect = selectedIndex === question.answer;
  const buttons = [...elements.options.querySelectorAll(".option-button")];

  buttons.forEach((button, index) => {
    button.disabled = true;
    if (index === question.answer) button.classList.add("correct");
    if (index === selectedIndex && !isCorrect) button.classList.add("wrong");
  });

  recordAnswer(question, isCorrect);
  updateStats();
  showFeedback(question, isCorrect);
}

function showFeedback(question, isCorrect) {
  const knowledgeId = question.knowledge_id || question.knowledgeId;
  const knowledge = state.knowledge[knowledgeId];
  const answerLetter = String.fromCharCode(65 + question.answer);

  elements.resultBanner.className = `result-banner ${isCorrect ? "correct" : "wrong"}`;
  elements.resultBanner.textContent = isCorrect
    ? `回答正确！正确答案：${answerLetter}. ${question.options[question.answer]}`
    : `回答错误。正确答案：${answerLetter}. ${question.options[question.answer]}`;
  elements.explanation.textContent = question.explanation;
  elements.knowledgeFormula.textContent = knowledge.formula;
  elements.knowledgeRule.textContent = knowledge.rule;
  elements.knowledgeExample.textContent = knowledge.example;
  elements.knowledgeTranslation.textContent = knowledge.translation;
  elements.knowledgeError.textContent = knowledge.common_error;
  elements.knowledgeTags.replaceChildren(
    ...knowledge.tags.map((tag) => {
      const badge = document.createElement("span");
      badge.textContent = tag;
      return badge;
    })
  );
  elements.feedback.classList.remove("hidden");
  elements.nextButton.disabled = false;
}

function chooseSmartQuestion() {
  const candidates = state.filteredQuestions.filter(
    (question) => !state.recentQuestionIds.includes(question.id)
  );
  const pool = candidates.length ? candidates : state.filteredQuestions;
  const weighted = pool.map((question) => ({
    question,
    weight: getKnowledgeWeight(question.knowledge_id || question.knowledgeId)
  }));
  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  let target = Math.random() * totalWeight;
  const selected = weighted.find((item) => {
    target -= item.weight;
    return target <= 0;
  }).question;

  state.recentQuestionIds.push(selected.id);
  if (state.recentQuestionIds.length > Math.min(5, state.filteredQuestions.length - 1)) {
    state.recentQuestionIds.shift();
  }
  return selected;
}

function getKnowledgeWeight(knowledgeId) {
  const stats = state.progress.knowledgeStats[knowledgeId];
  if (!stats) return 2;

  const daysSinceWrong = stats.lastWrongAt
    ? (Date.now() - new Date(stats.lastWrongAt).getTime()) / 86400000
    : Infinity;
  const recentWrongBoost = daysSinceWrong <= 3 ? 3 : daysSinceWrong <= 14 ? 1.5 : 0;
  const errorRate = stats.attempts ? stats.wrong / stats.attempts : 0;
  const stabilityReduction = Math.min(stats.correctStreak * 0.35, 1.5);
  return Math.max(0.5, 1 + stats.wrong * 0.8 + errorRate * 3 + recentWrongBoost - stabilityReduction);
}

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem("toeicPart5Progress")) || {};
    return {
      attemptedIds: saved.attemptedIds || [],
      totalAttempts: saved.totalAttempts || 0,
      correctAttempts: saved.correctAttempts || 0,
      mistakes: saved.mistakes || {},
      knowledgeStats: normalizeKnowledgeStats(saved.knowledgeStats || {})
    };
  } catch {
    return { attemptedIds: [], totalAttempts: 0, correctAttempts: 0, mistakes: {}, knowledgeStats: {} };
  }
}

function saveProgress() {
  localStorage.setItem("toeicPart5Progress", JSON.stringify(state.progress));
}

function normalizeKnowledgeStats(stats) {
  return Object.fromEntries(Object.entries(stats).map(([id, value]) => {
    const attempts = value.attempts || 0;
    const wrong = value.wrong ?? value.wrongCount ?? 0;
    const correct = value.correct ?? Math.max(0, attempts - wrong);
    const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0;
    return [id, {
      attempts,
      correct,
      wrong,
      accuracy,
      mastery: accuracy,
      last_practiced: value.last_practiced || value.lastAnsweredAt || null,
      correctStreak: value.correctStreak || 0,
      lastWrongAt: value.lastWrongAt || null
    }];
  }));
}

function recordAnswer(question, isCorrect) {
  const knowledgeId = question.knowledge_id || question.knowledgeId;
  const now = new Date().toISOString();
  if (!state.progress.attemptedIds.includes(question.id)) {
    state.progress.attemptedIds.push(question.id);
  }
  state.progress.totalAttempts += 1;
  if (isCorrect) {
    state.progress.correctAttempts += 1;
  } else {
    const previous = state.progress.mistakes[question.id];
    state.progress.mistakes[question.id] = {
      wrongCount: previous ? previous.wrongCount + 1 : 1,
      lastAnsweredAt: now,
      knowledge_id: knowledgeId
    };
  }
  const knowledgeStats = state.progress.knowledgeStats[knowledgeId] || {
    attempts: 0,
    correct: 0,
    wrong: 0,
    accuracy: 0,
    mastery: 0,
    last_practiced: null,
    correctStreak: 0,
    lastWrongAt: null
  };
  knowledgeStats.attempts += 1;
  knowledgeStats.last_practiced = now;
  if (isCorrect) {
    knowledgeStats.correct += 1;
    knowledgeStats.correctStreak += 1;
  } else {
    knowledgeStats.wrong += 1;
    knowledgeStats.correctStreak = 0;
    knowledgeStats.lastWrongAt = now;
  }
  knowledgeStats.accuracy = Math.round((knowledgeStats.correct / knowledgeStats.attempts) * 100);
  knowledgeStats.mastery = knowledgeStats.accuracy;
  state.progress.knowledgeStats[knowledgeId] = knowledgeStats;
  saveProgress();
}

function updateStats() {
  const { totalAttempts, correctAttempts, attemptedIds, mistakes } = state.progress;
  const accuracy = totalAttempts === 0 ? 0 : Math.round((correctAttempts / totalAttempts) * 100);
  elements.totalCount.textContent = state.questions.length;
  elements.answeredCount.textContent = attemptedIds.length;
  elements.accuracy.textContent = `${accuracy}%`;
  elements.mistakeCount.textContent = Object.keys(mistakes).length;
  updateMastery();
}

function updateMastery() {
  const knowledgeItems = Object.values(state.knowledge);
  if (!knowledgeItems.length) return;

  const categoryCounts = knowledgeItems.reduce((counts, item) => {
    counts[item.category] = (counts[item.category] || 0) + 1;
    return counts;
  }, {});
  const results = knowledgeItems.map((item) => {
    const stats = state.progress.knowledgeStats[item.id];
    const score = stats ? stats.mastery : 0;
    const weight = (categoryWeights[item.category] || 8) / categoryCounts[item.category];
    return { item, score, weight };
  });
  const totalWeight = results.reduce((sum, result) => sum + result.weight, 0);
  const totalScore = Math.round(
    results.reduce((sum, result) => sum + result.score * result.weight, 0) / totalWeight
  );

  elements.masteryPercent.textContent = `${totalScore}%`;
  elements.masteryBar.style.width = `${totalScore}%`;
  elements.masteryList.replaceChildren(
    ...results
      .sort((a, b) => a.score - b.score)
      .map(({ item, score, weight }) => {
        const stats = state.progress.knowledgeStats[item.id];
        const status = getMasteryStatus(stats);
        const row = document.createElement("div");
        row.className = "mastery-row";
        row.innerHTML = `
          <div>
            <strong>${item.formula}</strong>
            <small>${item.category} · 权重 ${weight.toFixed(1)}% · 最近练习 ${formatDate(stats?.last_practiced)}</small>
          </div>
          <span class="mini-track"><span style="width:${score}%"></span></span>
          <b>${score}%<small>${stats?.attempts || 0} 次 · ${status}</small></b>
        `;
        return row;
      })
  );
  updateCategoryDashboard(knowledgeItems);
  updateWeakestList(knowledgeItems);
}

function getMasteryStatus(stats) {
  if (!stats || stats.attempts < 3) return "样本不足";
  if (stats.accuracy >= 85) return "熟悉";
  if (stats.accuracy >= 60) return "待加强";
  return "薄弱";
}

function getWeakKnowledgeIds() {
  return Object.values(state.knowledge)
    .filter((item) => {
      const stats = state.progress.knowledgeStats[item.id];
      return stats && stats.attempts >= 3 && stats.accuracy < 60;
    })
    .map((item) => item.id);
}

function updateCategoryDashboard(knowledgeItems) {
  elements.categoryDashboard.replaceChildren(...categories.map((category) => {
    const ids = knowledgeItems.filter((item) => item.category === category).map((item) => item.id);
    const stats = ids.map((id) => state.progress.knowledgeStats[id]).filter(Boolean);
    const attempts = stats.reduce((sum, item) => sum + item.attempts, 0);
    const correct = stats.reduce((sum, item) => sum + item.correct, 0);
    const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0;
    const card = document.createElement("div");
    card.innerHTML = `<span>${category}</span><strong>${accuracy}%</strong><small>${attempts} 次作答</small>`;
    return card;
  }));
}

function updateWeakestList(knowledgeItems) {
  const weakest = knowledgeItems
    .map((item) => ({ item, stats: state.progress.knowledgeStats[item.id] }))
    .filter(({ stats }) => stats && stats.attempts > 0)
    .sort((a, b) => a.stats.accuracy - b.stats.accuracy || b.stats.attempts - a.stats.attempts)
    .slice(0, 5);
  elements.weakestList.replaceChildren(...weakest.map(({ item, stats }) => {
    const badge = document.createElement("span");
    badge.textContent = `${item.formula} · ${stats.accuracy}%`;
    return badge;
  }));
  elements.weakestList.parentElement.classList.toggle("hidden", weakest.length === 0);
}

function formatDate(value) {
  if (!value) return "尚未练习";
  return new Date(value).toLocaleDateString("zh-CN");
}

function nextQuestion() {
  if (state.mode === "mistakes") {
    state.currentIndex = (state.currentIndex + 1) % state.filteredQuestions.length;
  }
  renderQuestion();
  elements.quizCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

elements.categorySelect.addEventListener("change", (event) => startPractice(event.target.value));
elements.nextButton.addEventListener("click", nextQuestion);
elements.allQuestionsButton.addEventListener("click", () => setMode("all"));
elements.mistakesButton.addEventListener("click", () => setMode("mistakes"));
elements.weakButton.addEventListener("click", () => setMode("weak"));
elements.clearMistakesButton.addEventListener("click", clearMistakes);
elements.showExplanationButton.addEventListener("click", () => {
  const willShow = elements.explanationPanel.classList.contains("hidden");
  elements.explanationPanel.classList.toggle("hidden", !willShow);
  elements.showExplanationButton.textContent = willShow ? "收起解析" : "查看解析";
});

let installPrompt;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  elements.installButton.classList.remove("hidden");
});

elements.installButton.addEventListener("click", async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  elements.installButton.classList.add("hidden");
});

window.addEventListener("appinstalled", () => {
  elements.installButton.classList.add("hidden");
});

function updateConnectionStatus() {
  const isOnline = navigator.onLine;
  elements.connectionStatus.textContent = isOnline ? "在线" : "离线可用";
  elements.connectionStatus.classList.toggle("offline", !isOnline);
}

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);
updateConnectionStatus();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
}

function setMode(mode) {
  state.mode = mode;
  elements.allQuestionsButton.classList.toggle("active", mode === "all");
  elements.mistakesButton.classList.toggle("active", mode === "mistakes");
  elements.weakButton.classList.toggle("active", mode === "weak");
  startPractice(elements.categorySelect.value);
}

function clearMistakes() {
  state.progress.mistakes = {};
  saveProgress();
  updateStats();
  if (state.mode === "mistakes") startPractice(elements.categorySelect.value);
}

loadData();
