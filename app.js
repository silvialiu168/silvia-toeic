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

const state = {
  questions: [],
  knowledge: {},
  filteredQuestions: [],
  currentIndex: 0,
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
  clearMistakesButton: document.querySelector("#clearMistakesButton"),
  installButton: document.querySelector("#installButton"),
  connectionStatus: document.querySelector("#connectionStatus"),
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
    : categoryQuestions;
  state.currentIndex = 0;
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
      : "此分类目前没有题目。";
    elements.questionCount.textContent = "共 0 题";
    return;
  }
  elements.errorState.classList.add("hidden");
  elements.quizCard.classList.remove("hidden");
  renderQuestion();
}

function renderQuestion() {
  const question = state.filteredQuestions[state.currentIndex];
  state.locked = false;

  elements.categoryBadge.textContent = question.category;
  elements.progressText.textContent = `第 ${state.currentIndex + 1} / ${state.filteredQuestions.length} 题`;
  elements.questionCount.textContent = `本分类共 ${state.filteredQuestions.length} 题`;
  elements.questionText.textContent = question.question;
  elements.options.replaceChildren();
  elements.feedback.classList.add("hidden");
  elements.nextButton.disabled = true;
  elements.nextButton.textContent =
    state.currentIndex === state.filteredQuestions.length - 1 ? "重新开始" : "下一题";

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
  const question = state.filteredQuestions[state.currentIndex];
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

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem("toeicPart5Progress")) || {
      attemptedIds: [],
      totalAttempts: 0,
      correctAttempts: 0,
      mistakes: {}
    };
  } catch {
    return { attemptedIds: [], totalAttempts: 0, correctAttempts: 0, mistakes: {} };
  }
}

function saveProgress() {
  localStorage.setItem("toeicPart5Progress", JSON.stringify(state.progress));
}

function recordAnswer(question, isCorrect) {
  if (!state.progress.attemptedIds.includes(question.id)) {
    state.progress.attemptedIds.push(question.id);
  }
  state.progress.totalAttempts += 1;
  if (isCorrect) {
    state.progress.correctAttempts += 1;
  } else {
    const knowledgeId = question.knowledge_id || question.knowledgeId;
    const previous = state.progress.mistakes[question.id];
    state.progress.mistakes[question.id] = {
      wrongCount: previous ? previous.wrongCount + 1 : 1,
      lastAnsweredAt: new Date().toISOString(),
      knowledge_id: knowledgeId
    };
  }
  saveProgress();
}

function updateStats() {
  const { totalAttempts, correctAttempts, attemptedIds, mistakes } = state.progress;
  const accuracy = totalAttempts === 0 ? 0 : Math.round((correctAttempts / totalAttempts) * 100);
  elements.totalCount.textContent = state.questions.length;
  elements.answeredCount.textContent = attemptedIds.length;
  elements.accuracy.textContent = `${accuracy}%`;
  elements.mistakeCount.textContent = Object.keys(mistakes).length;
}

function nextQuestion() {
  state.currentIndex = (state.currentIndex + 1) % state.filteredQuestions.length;
  renderQuestion();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

elements.categorySelect.addEventListener("change", (event) => startPractice(event.target.value));
elements.nextButton.addEventListener("click", nextQuestion);
elements.allQuestionsButton.addEventListener("click", () => setMode("all"));
elements.mistakesButton.addEventListener("click", () => setMode("mistakes"));
elements.clearMistakesButton.addEventListener("click", clearMistakes);

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
  startPractice(elements.categorySelect.value);
}

function clearMistakes() {
  state.progress.mistakes = {};
  saveProgress();
  updateStats();
  if (state.mode === "mistakes") startPractice(elements.categorySelect.value);
}

loadData();
