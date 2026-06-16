const DATA="data/", DATA_VERSION="33", $=s=>document.querySelector(s);
const state={users:[],user:null,questions:[],knowledge:[],vocab:[],pastPapers:null,stats:null,vocabStats:null,current:null,vocabQuestion:null,grammarMode:"smart",vocabMode:"en-zh"};
const today=()=>new Date().toISOString().slice(0,10);
const read=k=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}};
const emptyStats=()=>({attempts:0,correct:0,wrong:0,mistakes:{},knowledge:{},daily:{},minutes:0,streak:0,bonus_points:0,goal_rewards:{},milestone_awards:[],season_started_at:null});
const emptyVocab=()=>({words:{},favorites:[],daily_plans:{}});
const normalizeStats=s=>({...emptyStats(),...(s||{}),mistakes:s?.mistakes||{},knowledge:s?.knowledge||{},daily:s?.daily||{}});
const normalizeVocab=v=>({...emptyVocab(),...(v||{}),words:v?.words||{},favorites:v?.favorites||[],daily_plans:v?.daily_plans||{}});
const userData=u=>({stats:normalizeStats(read(u.stats_key)),vocab:normalizeVocab(read(u.vocab_key))});
const points=u=>{const d=userData(u);return d.stats.correct*10+Object.values(d.vocab.words).reduce((s,x)=>s+(x.correct||0)*5,0)+(d.stats.bonus_points||0)};
async function json(f){return(await fetch(`${DATA}${f}?v=${DATA_VERSION}`)).json()}
function save(){localStorage.setItem(state.user.stats_key,JSON.stringify(state.stats));localStorage.setItem(state.user.vocab_key,JSON.stringify(state.vocabStats))}
function resetLocalRecordsFromQuery(){
  if(new URLSearchParams(location.search).get("reset")!=="records")return;
  Object.keys(localStorage).filter(k=>k.startsWith("liu_trainer_")).forEach(k=>localStorage.removeItem(k));
  if(history.replaceState)history.replaceState(null,"",location.pathname+"?reset=done");
}

async function init(){
  resetLocalRecordsFromQuery();
  state.users=await json("users.json");migrateOldSilviaData();setupNav();setupInstall();await activateUser(state.users[0],false);renderDashboard();showPage("dashboardPage");
}
function migrateOldSilviaData(){
  if(read("liu_trainer_silvia_stats"))return;
  const old=read("toeicPart5Progress");if(!old)return;
  const migrated=emptyStats();migrated.attempts=old.totalAttempts||old.attemptedIds?.length||0;migrated.correct=old.correctAttempts||0;migrated.wrong=Math.max(0,migrated.attempts-migrated.correct);migrated.mistakes=old.mistakes||{};
  Object.entries(old.knowledgeStats||{}).forEach(([id,s])=>{const attempts=s.attempts||0,wrong=s.wrong??s.wrongCount??0,correct=s.correct??Math.max(0,attempts-wrong);migrated.knowledge[id]={attempts,correct,wrong,accuracy:attempts?Math.round(correct/attempts*100):0,mastery:attempts?Math.round(correct/attempts*100):0,last_practiced:s.last_practiced||s.lastAnsweredAt||null}});
  localStorage.setItem("liu_trainer_silvia_stats",JSON.stringify(migrated));
}
async function activateUser(u,openLearn=true){
  state.user=u;({stats:state.stats,vocab:state.vocabStats}=userData(u));const knowledge=[...await json("knowledge_common.json"),...await json(`knowledge_${u.level}.json`)];if(u.level==="junior")knowledge.push(...await json("knowledge_junior_past.json"));state.knowledge=[...new Map(knowledge.map(k=>[k.id,k])).values()];const baseQuestions=await json(`questions_${u.level}.json`),pastQuestions=u.level==="junior"?(await json("questions_junior_past.json")).questions.filter(q=>q.practiceReady!==false):[];state.questions=[...pastQuestions,...baseQuestions].filter(isTrustedQuestion).map(q=>({...q,knowledgePoint:q.knowledgePoint||q.knowledge_id||q.knowledgeId,knowledge_id:q.knowledge_id||q.knowledgePoint||q.knowledgeId}));state.vocab=(await json(`vocab_${u.level}.json`)).filter(v=>v.practiceReady!==false);state.pastPapers=u.level==="junior"?await json("past_papers_junior.json"):null;
  $("#pageTitle").textContent=`${u.name} · ${u.goal}`;renderAll();if(openLearn)showPage("learnPage");
}
function setupNav(){$("#bottomNav").classList.remove("hidden");$("#bottomNav").onclick=e=>{const b=e.target.closest("button");if(b)showPage(b.dataset.page)};$("#homeButton").onclick=()=>showPage("dashboardPage")}
function showPage(id){$("#familyView").classList.add("hidden");$("#learnerView").classList.remove("hidden");document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===id));document.querySelectorAll("#bottomNav button").forEach(x=>x.classList.toggle("active",x.dataset.page===id));$("#pageTitle").textContent=id==="dashboardPage"?"Family English Challenge":`${state.user.name} · ${state.user.goal}`;if(id==="dashboardPage")renderDashboard()}
function progressFor(u,d){const done=d.stats.attempts+Object.values(d.vocab.words).reduce((s,x)=>s+x.attempts,0);return Math.min(100,Math.round(done/100*100))}
function silviaScores(d){const listening=330,baseReading=395,targetReading=495,attempts=d.stats.attempts||0,accuracy=attempts?d.stats.correct/attempts:0,volume=Math.min(1,attempts/400),reading=Math.min(targetReading,Math.round(baseReading+(targetReading-baseReading)*volume*(.4+.6*accuracy))),gained=Math.max(0,reading-baseReading),gap=targetReading-baseReading;return{listening,baseReading,reading,total:listening+reading,targetReading,gained,gap,progress:Math.round(gained/gap*100),remaining:Math.max(0,targetReading-reading)}}
function seasonStarted(d){return !!(d.stats.season_started_at||d.stats.attempts||Object.keys(d.vocab.words||{}).length)}
function startSeason(u){
  const d=userData(u);d.stats.season_started_at=new Date().toISOString();localStorage.setItem(u.stats_key,JSON.stringify(d.stats));
  document.querySelector(".season-launch")?.remove();const el=document.createElement("div");el.className=`season-launch launch-${u.id}`;el.innerHTML=`<span>ROOKIE SEASON</span><strong>${u.name}</strong><b>${u.id==="brother"?"THUNDER RISING":"PLAYMAKER JOURNEY"}</b><small>${u.id==="brother"?"新秀賽季正式啟動":"組織者學習旅程正式啟動"}</small>`;document.body.appendChild(el);setTimeout(()=>{el.remove();renderDashboard()},2600)
}
function stageNext(u){const i=u.stages.indexOf(u.current_stage);return u.stages[Math.min(i+1,u.stages.length-1)]}
function todayData(u,d){const day=d.stats.daily[today()]||{},grammar=day.grammar||0,vocab=day.vocab??Object.values(d.vocab.words).filter(x=>x.last_practiced?.startsWith(today())).length;return{grammar,vocab,minutes:day.minutes||d.stats.minutes||0}}
function progressCard(type){
  const t=todayData(state.user,{stats:state.stats,vocab:state.vocabStats}),done=Math.min(20,t[type]),pct=Math.round(done/20*100),left=Math.max(0,20-done),label=type==="grammar"?"文法":"單字";
  return`<section class="practice-progress" data-progress="${type}"><div><strong>${label}</strong><span>🔥 連續學習第${state.stats.streak||0}天</span></div><div class="goal-progress"><i style="width:${pct}%"></i></div><b>${done} / 20（${pct}%）</b><small>${left?`還差${left}題完成今日目標`:"今日目標已完成 ✓"}</small></section>`;
}
function updateProgressWidgets(){document.querySelectorAll('[data-progress="grammar"]').forEach(x=>x.outerHTML=progressCard("grammar"));document.querySelectorAll('[data-progress="vocab"]').forEach(x=>x.outerHTML=progressCard("vocab"))}
function showToast(title,lines){document.querySelector(".reward-toast")?.remove();const el=document.createElement("div");el.className="reward-toast";el.innerHTML=`<strong>${title}</strong>${lines.map(x=>`<span>${x}</span>`).join("")}`;document.body.appendChild(el);setTimeout(()=>el.remove(),3000)}
function checkRewards(){
  const t=todayData(state.user,{stats:state.stats,vocab:state.vocabStats}),key=today();
  if(t.grammar>=20&&t.vocab>=20&&!state.stats.goal_rewards[key]){state.stats.goal_rewards[key]=true;state.stats.bonus_points=(state.stats.bonus_points||0)+20;save();showToast("🎉 今日目標完成",["文法 ✓　單字 ✓","获得20學習積分"])}
  const milestones=[3,7,14,30,100],hit=milestones.find(x=>state.stats.streak===x&&!state.stats.milestone_awards.includes(x));if(hit){state.stats.milestone_awards.push(hit);state.stats.bonus_points=(state.stats.bonus_points||0)+hit;save();showToast(`🔥 連續學習 ${hit} 天`,[`里程碑達成，获得 ${hit} 積分`])}
}
function weakestKnowledge(limit=5){
  return state.knowledge.map(k=>({k,s:state.stats.knowledge[k.id]||{attempts:0,accuracy:0,mastery:0}})).sort((a,b)=>{
    if(a.s.attempts===0&&b.s.attempts>0)return 1;
    if(b.s.attempts===0&&a.s.attempts>0)return-1;
    return a.s.accuracy-b.s.accuracy||b.s.attempts-a.s.attempts;
  }).slice(0,limit);
}
const questionKnowledge=q=>q.knowledge_id||q.knowledgeId||[q.domain,q.knowledgePoint,q.secondaryPoint].filter(Boolean).join("／")||q.knowledgePoint;
const isTrustedQuestion=q=>{
  const approved=["approved","user_confirmed"].includes(q.review_status);
  const official=q.source_type==="official_past_paper"&&q.answer_verified===true;
  return approved||official;
};
function knowledgeSummary(){
  const result={mastered:0,weak:0,unlearned:0,learning:0},coverage=new Map(state.knowledge.map(k=>[k.id,0]));
  state.questions.forEach(q=>coverage.set(questionKnowledge(q),(coverage.get(questionKnowledge(q))||0)+1));
  state.knowledge.forEach(k=>{const s=state.stats.knowledge[k.id];if(!s?.attempts)result.unlearned++;else if(s.attempts>=3&&s.accuracy>=85)result.mastered++;else if(s.accuracy<60)result.weak++;else result.learning++});
  return{...result,total:state.knowledge.length,covered:[...coverage.values()].filter(n=>n>0).length,underFive:[...coverage.values()].filter(n=>n<5).length,questions:state.questions.length};
}
function renderDashboard(){
  $("#familyView").classList.add("hidden");const p=$("#dashboardPage");p.innerHTML=`<div class="hero"><p>距離目標還差多少？</p><div class="family-score"><strong>${state.users.filter(u=>{const t=todayData(u,userData(u));return t.vocab>=20&&t.grammar>=20&&t.minutes>=30}).length}</strong><span>今日完成人數</span></div></div><div class="dashboard-users">${state.users.map(u=>{const d=userData(u),t=todayData(u,d),started=seasonStarted(d),active=state.user.id===u.id,mode=u.id==="silvia"?"Data Dashboard Mode":u.id==="brother"?"Thunder Career Mode":'Playmaker Career Mode<small>組織者生涯模式</small>';if(!started&&u.id!=="silvia")return`<article class="user-card mode-${u.id} season-card ${active?"selected-user":""}" data-select="${u.id}"><div class="mode-label">${mode}</div><strong>${u.name}</strong><span>${u.goal}</span><p>Rookie Season 尚未開始</p>${active?`<button type="button" class="primary start-season" data-start="${u.id}">開始訓練</button>`:'<small>點選卡片後開始自己的旅程</small>'}</article>`;if(u.id==="silvia"){const s=silviaScores(d);return`<article class="user-card mode-silvia ${active?"selected-user":""}" data-select="${u.id}"><div class="mode-label">${mode}</div><strong>${u.name}</strong><span>TOEIC Reading 495</span><div class="reading-score-line"><b>${s.reading}</b><span>→</span><strong>${s.targetReading}</strong></div><div class="user-progress"><i style="width:${s.progress}%"></i></div><small>已提升 ${s.gained} 分 / 成長空間 ${s.gap} 分 · 進度 ${s.progress}%</small><div class="dashboard-line"><span>${t.vocab>=20?"✅":"⏳"} 單字 ${t.vocab}/20</span><span>${t.grammar>=20?"✅":"⏳"} 文法 ${t.grammar}/20</span></div><small>距離 Reading 滿分還差 ${s.remaining} 分</small>${active?`<button type="button" class="go-training go-silvia" data-go="${u.id}">GO</button>`:""}</article>`}const progress=progressFor(u,d);return`<article class="user-card mode-${u.id} ${active?"selected-user":""}" data-select="${u.id}"><div class="mode-label">${mode}</div><strong>${u.name}</strong><span>${u.goal}</span><div class="user-progress"><i style="width:${progress}%"></i></div><small>Rookie Season · 掌握度 ${progress}%</small><div class="dashboard-line"><span>${t.vocab>=20?"✅":"⏳"} 單字 ${t.vocab}/20</span><span>${t.grammar>=20?"✅":"⏳"} 文法 ${t.grammar}/20</span></div><small>🔥 連續學習 ${d.stats.streak||0} 天 · 本週積分 ${points(u)}</small>${active?`<button type="button" class="go-training" data-go="${u.id}">GO</button>`:""}</article>`}).join("")}</div><section class="panel"><h2>家庭排行榜</h2>${leaderboardHtml()}</section>`;
  p.querySelectorAll("[data-select]").forEach(card=>card.onclick=e=>{if(e.target.closest("button"))return;activateUser(state.users.find(u=>u.id===card.dataset.select),false);showPage("dashboardPage")});p.querySelectorAll("[data-start]").forEach(b=>b.onclick=()=>startSeason(state.users.find(u=>u.id===b.dataset.start)));p.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>activateUser(state.users.find(u=>u.id===b.dataset.go)));
}
function leaderboardHtml(){return[...state.users].sort((a,b)=>points(b)-points(a)).map((u,i)=>`<div class="rank-row"><b>${["🥇","🥈","🥉"][i]}</b><span>${u.name}</span><strong>${points(u)} 分</strong></div>`).join("")}

function renderLearn(){
  $("#learnPage").innerHTML=`<div class="streak-reminder">${streakReminder()}</div><div class="tabs"><button class="active" data-tab="grammar">文法</button><button data-tab="vocab">單字</button><button data-tab="reading">閱讀</button></div><section id="grammar" class="learn-section active"></section><section id="vocab" class="learn-section"></section><section id="reading" class="learn-section"></section>`;
  $("#learnPage .tabs").onclick=e=>{const b=e.target.closest("button");if(!b)return;$("#learnPage").querySelectorAll(".tabs button").forEach(x=>x.classList.toggle("active",x===b));$("#learnPage").querySelectorAll(".learn-section").forEach(x=>x.classList.toggle("active",x.id===b.dataset.tab))};
  renderGrammar();renderVocab();renderReading();
}
function streakReminder(){const t=todayData(state.user,{stats:state.stats,vocab:state.vocabStats}),left=Math.max(0,Math.min(20-t.grammar,20-t.vocab));return`🔥 已連續學習 ${state.stats.streak||0} 天　${left?`今天再完成 ${left} 題即可保持纪錄`:"今天已完成目標"}`}
function grammarPool(){
  if(state.grammarMode==="past")return state.questions.filter(q=>q.source?.includes("歷屆試題"));
  if(state.grammarMode==="mistakes"){
    const ids=new Set(Object.keys(state.stats.mistakes).map(String));
    return state.questions.filter(q=>ids.has(String(q.id)));
  }
  if(state.grammarMode==="weak"){
    const weakIds=Object.entries(state.stats.knowledge).filter(([,s])=>s.attempts>=1&&s.accuracy<60).map(([id])=>id);
    return state.questions.filter(q=>weakIds.includes(questionKnowledge(q)));
  }
  if(state.grammarMode==="smart"){
    const weighted=[];
    state.questions.forEach(q=>{
      const id=questionKnowledge(q),s=state.stats.knowledge[id],isMistake=!!state.stats.mistakes[q.id];
      const baseWeight=!s?.attempts?8:s.wrong_streak>=2?9:isMistake?7:s.accuracy<70?6:s.accuracy<85?3:1,weight=baseWeight*(q.source?.includes("歷屆試題")?3:1);
      for(let i=0;i<weight;i++)weighted.push(q);
    });
    return weighted;
  }
  return state.questions;
}
function setGrammarMode(mode){
  state.grammarMode=mode;
  delete $("#grammar").dataset.locked;
  renderGrammar();
}
function renderGrammar(){
  const pool=grammarPool(),labels={smart:"智能練習",...(state.user.level==="junior"?{past:"歷屆真題"}:{}),weak:"薄弱知識點",random:"隨機練習",mistakes:"錯題重練"};
  if(!pool.length){$("#grammar").innerHTML=`<div class="chips">${Object.entries(labels).map(([m,l])=>`<button class="chip ${state.grammarMode===m?"active":""}" data-mode="${m}">${l}</button>`).join("")}</div><article class="card"><h3>目前沒有通過審核的正式題目</h3><p>正式練習只使用官方歷屆試題、已有標準答案且通過審核的題目，或你已確認的題庫。待審核內容不會出現在這裡。</p></article>`;$("#grammar .chips").onclick=e=>{const b=e.target.closest("[data-mode]");if(b)setGrammarMode(b.dataset.mode)};return}
  state.current=pool[Math.floor(Math.random()*pool.length)];const q=state.current;
  const label=[q.domain,q.knowledgePoint,q.secondaryPoint].filter(Boolean).join("／")||q.category;
  $("#grammar").innerHTML=`${progressCard("grammar")}<div class="chips">${Object.entries(labels).map(([m,l])=>`<button type="button" class="chip ${state.grammarMode===m?"active":""}" data-mode="${m}">${l}</button>`).join("")}</div><article class="card practice-card"><div class="question-meta"><span class="chip">${label}</span>${q.classification_status==="needs_review"?`<span class="chip review-chip">待分類審核</span>`:""}${q.year?`<span class="chip official-chip">${q.year} 年會考 · 第 ${q.questionNo} 題</span>`:""}</div><p class="question">${q.question}</p><div class="options">${q.options.map((o,i)=>`<button type="button" class="option" data-i="${i}">${String.fromCharCode(65+i)}. ${o}</button>`).join("")}</div><button type="button" class="primary submit-answer" id="submitGrammar" disabled>请選擇一個答案</button><div id="grammarResult"></div></article>`;
  $("#grammar .chips").onclick=e=>{const b=e.target.closest("[data-mode]");if(b)setGrammarMode(b.dataset.mode)};
  $("#grammar .options").onclick=e=>{const b=e.target.closest(".option");if(!b||$("#grammar").dataset.locked)return;$("#grammar").querySelectorAll(".option").forEach(x=>x.classList.toggle("selected",x===b));$("#grammar").dataset.selected=b.dataset.i;$("#submitGrammar").disabled=false;$("#submitGrammar").textContent="提交答案"};
  $("#submitGrammar").onclick=()=>{if($("#grammar").dataset.selected===undefined||$("#grammar").dataset.locked)return;$("#grammar").dataset.locked=1;$("#submitGrammar").disabled=true;answerGrammar(Number($("#grammar").dataset.selected))};
}
function answerGrammar(i){
  const q=state.current,ok=i===q.answer,k=questionKnowledge(q),now=new Date().toISOString(),trackKnowledge=q.classification_status!=="needs_review",s=state.stats.knowledge[k]||{attempts:0,correct:0,wrong:0,wrong_streak:0};state.stats.attempts++;ok?state.stats.correct++:state.stats.wrong++;if(trackKnowledge){s.attempts++;ok?s.correct++:s.wrong++;s.wrong_streak=ok?0:(s.wrong_streak||0)+1;s.accuracy=Math.round(s.correct/s.attempts*100);s.mastery=s.accuracy;s.last_practiced=now;state.stats.knowledge[k]=s}if(!ok)state.stats.mistakes[q.id]={question:q,wrong:(state.stats.mistakes[q.id]?.wrong||0)+1};state.stats.daily[today()]={...(state.stats.daily[today()]||{}),grammar:(state.stats.daily[today()]?.grammar||0)+1};updateStreak();save();checkRewards();
  renderDashboard();renderGrowth();renderMistakes();renderFamily();updateProgressWidgets();
  $("#grammar").querySelectorAll(".option").forEach((b,n)=>{b.disabled=true;b.classList.toggle("correct",n===q.answer);b.classList.toggle("wrong",n===i&&!ok)});$("#submitGrammar").classList.add("hidden");
  $("#grammarResult").innerHTML=`<div class="result ${ok?"good":"bad"}">${ok?"答對":"答錯"} · 正確答案 ${q.options[q.answer]} · 累計已做 ${state.stats.attempts} 題</div><button type="button" class="primary next-grammar" id="nextG">下一題</button><div id="analysis" class="teacher-analysis">${teacherAnalysis(q,i,ok)}</div>`;$("#nextG").onclick=()=>{delete $("#grammar").dataset.locked;delete $("#grammar").dataset.selected;renderGrammar()};
}
function optionReason(q,o,i){
  const c=q.category||"",point=questionKnowledge(q)||"",lower=String(o).toLowerCase().trim(),answer=String(q.options[q.answer]).toLowerCase().trim();
  if(q.analysis?.option_reasons?.[lower])return q.analysis.option_reasons[lower];
  const wordType=x=>{
    if(["courtesy","care","review","decision","inspection","efficiency","clarity","availability","satisfaction"].includes(x))return"名詞";
    if(/ly$/.test(x))return"副詞";
    if(/(tion|sion|ment|ness|ity|ance|ence|ship|cy)$/.test(x))return"名詞";
    if(/(ous|ful|less|ive|able|ible|al|ic|ary|ory)$/.test(x))return"形容詞";
    if(/^to\s+\w+/.test(x))return"to + 原形動詞";
    if(/ing$/.test(x))return"V-ing";
    if(/(ed|en)$/.test(x))return"過去式或過去分詞";
    return"這個形式";
  };
  if(point==="pos-adverb"||c.includes("詞性")&&/ly$/.test(answer))return`${o} 是${wordType(lower)}；空格是在修飾前面的動作，需要副詞，所以不能選它。`;
  if(point==="pos-noun"||c.includes("詞性")&&/(tion|sion|ment|ness|ity|ance|ence)$/.test(answer))return`${o} 是${wordType(lower)}；空格前有冠詞或所有格，這個位置需要名詞，所以不能選它。`;
  if(point==="pos-adjective"||c.includes("詞性")&&/(ous|ful|less|ive|able|ible|al|ic|ary|ory|ed)$/.test(answer))return`${o} 是${wordType(lower)}；空格是在說明主詞的狀態，需要形容詞，所以不能選它。`;
  if(c.includes("介係詞")||c.includes("介詞")){
    const meanings={of:"通常表示「……的」",at:"通常指一個明確的地點或時間點",from:"通常表示來源或起點",with:"通常表示一起、使用某物或具有某物",between:"用在兩者之間",among:"用在一群人或事物之中",for:"通常表示對象、用途或目的",to:"通常表示方向，或出現在固定用法裡",in:"通常表示在某個範圍、地點或時間內",on:"通常表示在表面上，或用在特定日期"};
    return `${meanings[lower]||"它表達的意思"}，但這句話前後不是這種關係。`;
  }
  if(c.includes("連接詞")){const meanings={because:"表示原因",although:"表示「雖然」，帶出轉折",though:"表示「雖然」，帶出轉折",if:"表示條件",unless:"表示「除非」",while:"可表示同時或對比",when:"表示時間",but:"表示轉折",or:"表示選擇",and:"表示並列",so:"表示結果"};return`${o} ${meanings[lower]||"表達的關係"}，但題目前後不是這種邏輯關係。`;}
  if(c.includes("主謂一致"))return`${o} 無法和這題真正的主詞保持單複數一致；先找主詞，再決定用單數或複數動詞。`;
  if(c.includes("關係代名詞"))return`它代替的人或東西不對，或放進後半句後還是缺少重要內容。`;
  if(c.includes("動名詞"))return`${o} 的形式不符合空格附近需要的 V-ing 用法，或無法和句子結構正確連接。`;
  if(c.includes("不定詞"))return`${o} 不是這個位置需要的 to + 原形動詞形式。`;
  if(c.includes("被動"))return`${o} 無法表達主詞「被做某動作」的意思，或缺少正確的 be + 過去分詞結構。`;
  if(c.includes("形容詞語意"))return`${o} 雖然是形容詞，但描述的狀態和前後文情境不一致。`;
  if(c.includes("時態")||c.includes("完成式"))return`${o} 表達的時間關係和題目情境不一致。`;
  return `${o} 放回句子後，意思與上下文不合；它不能準確表達題目描述的情境。`;
}
function plainGrammarText(text){return String(text||"").replace(/\s*本題正確答案是\s*[「“"]?[^。；]+[」”"]?[。]?/g,"").replace(/\s+/g," ").trim()}
function knowledgeFocus(q,k){
  const point=questionKnowledge(q),before=q.question.split("_____")[0].trim(),last=before.match(/([A-Za-z]+)\W*$/)?.[1]||"空格前的字";
  const focuses={
    "pos-adverb":`空格是在補充動作 <b>${last}</b> 是怎麼做的，所以需要副詞修飾動詞。`,
    "pos-noun":"空格前有冠詞或所有格，這個位置需要放一個名詞。",
    "pos-adjective":"空格是在說明主詞的狀態或特徵，所以需要形容詞。",
    "prep-time":"先看空格後面的時間是時間點、日期，還是月份／年份。",
    "prep-purpose":"先問前面的東西是為了誰、為了什麼用途。",
    "conj-contrast":"先讀前後兩句；意思相反或出乎預期時，需要表示轉折的連接詞。",
    "conj-cause":"先判斷空格後面是完整句子還是名詞，再選 because 或 because of。",
    "time-clause":"先找時間連接詞；談未來時，時間子句通常不用 will。",
    "agreement-singular":"先找真正主詞，忽略中間補充資訊，再決定動詞單複數。",
    "agreement-each":"each、every、everyone 在文法上當單數，後面要配單數動詞。",
  };
  return focuses[point]||plainGrammarText(k.rule)||`先看空格前後，判斷這題的考點是 ${q.category}。`;
}
function correctReason(q,k,answer){
  const point=questionKnowledge(q),before=q.question.split("_____")[0].trim(),last=before.match(/([A-Za-z]+)\W*$/)?.[1]||"前面的動作";
  const reasons={
    "pos-adverb":`${last} 是動詞，${answer} 是副詞，能說明這個動作是怎麼進行的，因此選 ${answer}。`,
    "pos-noun":`${answer} 是名詞，能放在冠詞或所有格後面，讓句子結構完整。`,
    "pos-adjective":`${answer} 是形容詞，能用來說明主詞的狀態或特徵。`,
    "prep-time":`${answer} 和空格後面的時間用法正確，因此選 ${answer}。`,
    "prep-purpose":`${answer} 能表達題目中的對象或用途，因此選 ${answer}。`,
    "conj-contrast":`${answer} 能連接兩個意思有轉折的完整句子。`,
    "conj-cause":`${answer} 後面的結構和它的用法相符，也能正確說明原因。`,
    "time-clause":`${answer} 符合時間副詞子句談未來時使用現在式的規則。`,
    "agreement-singular":`${answer} 能和真正的單數主詞一致。`,
    "agreement-each":`${answer} 是單數動詞，能和 each／every 類的單數主詞一致。`,
  };
  return reasons[point]||plainGrammarText(q.explanation)||plainGrammarText(k.rule)||`${answer} 放回句子後，文法和意思都正確。`;
}
function teacherAnalysis(q,chosen,ok){
  if(q.analysis_ready===false)return`<section class="teacher-step"><h4>解析待分類審核</h4><p>這題的正式答案已核對，但知識點分類尚未達到高可信度。為避免產生錯誤解析，暫時不顯示講解。</p></section>`;
  const k=state.knowledge.find(x=>x.id===questionKnowledge(q))||{},parts=q.question.split("_____"),answer=q.options[q.answer],full=q.question.replace("_____",answer),translation=q.sentence_translation||q.translation||"",label=[q.domain,q.knowledgePoint,q.secondaryPoint].filter(Boolean).join("／")||q.category;
  const wrong=q.options.map((o,i)=>i===q.answer?"":`<div class="option-reason"><b>${o}</b>：${optionReason(q,o,i)}</div>`).join("");
  const focus=q.analysis?.focus||knowledgeFocus(q,k),reason=q.analysis?.correct_reason||correctReason(q,k,answer),trap=q.analysis?.common_trap||plainGrammarText(k.common_error)||"把答案放回整句讀一次，確認形式和意思都合理。";
  return`<section class="teacher-step"><h4>1. 本題考什麼</h4><p><b>${label}</b><br>${focus}</p></section><section class="teacher-step answer-plain"><h4>2. 為什麼答案正確</h4><p>${reason}</p><p class="full-sentence"><b>完整句子：</b>${full}${translation?`<br><b>中文翻譯：</b>${translation}`:""}</p></section><section class="teacher-step"><h4>3. 為什麼其他選項錯</h4>${wrong}${!ok?`<p><b>你選的 ${q.options[chosen]}：</b>${trap}</p>`:""}</section><section class="teacher-step related"><h4>4. 同類題看到怎麼解</h4><p><b>${k.formula||label}</b><br>${plainGrammarText(k.rule)||trap}${k.example?`<br><b>例句：</b>${k.example}`:""}</p></section>`}

function status(s){if(!s?.attempts)return"未學習";if(s.attempts<3)return"待觀察";return s.accuracy>=85?"熟悉":s.accuracy>=60?"待加強":"薄弱"}
function vocabStatus(s){return s?.status||(!s?.attempts?"New":s.correct>=5?"Mastered":s.correct>=3?"Familiar":"Learning")}
function accuracyText(s){return!s?.attempts?"尚未作答":s.attempts<3?`作答 ${s.attempts} 題 · 待觀察`:`正確率 ${s.accuracy}%`}
function renderVocab(){const modes={"en-zh":"英文選中文","zh-en":"中文選英文",sentence:"例句填空",pos:"詞性判斷",forms:"詞形變化"},bookWords=state.vocab.slice(0,200);$("#vocab").innerHTML=`${progressCard("vocab")}<div class="chips practice-modes">${Object.entries(modes).map(([m,l])=>`<button type="button" class="chip ${state.vocabMode===m?"active":""}" data-vmode="${m}">${l}</button>`).join("")}</div><div id="vocabPractice"></div><button type="button" class="secondary vocab-book-toggle" id="toggleVocabBook">展開單字本（${state.vocab.length}）</button><div class="vocab-list hidden" id="vocabBook">${state.vocab.length>200?`<small>單字量較大，目前先顯示前 200 個；練習會使用完整詞庫。</small>`:""}${bookWords.map(v=>{const s=state.vocabStats.words[v.id];return`<div class="vocab-item"><strong>${v.word}</strong><span><b>${vocabPosLabel(v)}</b>　${vocabMeaning(v)}</span><small>${vocabStatus(s)} · ${accuracyText(s)}</small></div>`}).join("")}</div>`;$("#vocab .chips").onclick=e=>{const b=e.target.closest("[data-vmode]");if(!b)return;state.vocabMode=b.dataset.vmode;renderVocab()};$("#toggleVocabBook").onclick=()=>{const book=$("#vocabBook"),hidden=book.classList.toggle("hidden");$("#toggleVocabBook").textContent=hidden?`展開單字本（${state.vocab.length}）`:"收起單字本"};vocabQuestion()}
function shuffle(a){return[...a].sort(()=>Math.random()-.5)}
function formsFor(v){
  const w=v.word,original=v.forms||{},past=original.past===`${w}ed`&&w.endsWith("e")?`${w}d`:original.past||`${w}ed`,ing=original.ing===`${w}ing`&&w.endsWith("e")?`${w.slice(0,-1)}ing`:original.ing||`${w}ing`;
  return{base:original.base||w,third_person:original.third_person||`${w}s`,past,past_participle:original.past_participle===`${w}ed`&&w.endsWith("e")?`${w}d`:original.past_participle||past,ing};
}
const posShort={verb:"V",noun:"N",adjective:"Adj",adverb:"Adv",preposition:"Prep",conjunction:"Conj",pronoun:"Pron"};
function vocabPos(v){return(v.part_of_speech||[]).filter(x=>x&&x!=="word")}
function vocabPosLabel(v){return vocabPos(v).map(x=>posShort[x]||x).join(".")||"—"}
function vocabMeaning(v){return v.meaningZh||v.chinese||""}
function similarVocab(v){
  const wanted=vocabPos(v),same=state.vocab.filter(x=>x.id!==v.id&&vocabPos(x).some(p=>wanted.includes(p))),rest=state.vocab.filter(x=>x.id!==v.id&&!same.includes(x));
  return [...shuffle(same),...shuffle(rest)].slice(0,3);
}
const dayDiff=iso=>iso?Math.floor((new Date(iso)-new Date(`${today()}T00:00:00`))/86400000):9999;
function buildDailyVocabPlan(){
  if(state.vocabStats.daily_plans[today()])return state.vocabStats.daily_plans[today()];
  const scored=state.vocab.map(v=>{const s=state.vocabStats.words[v.id]||{},status=vocabStatus(s),due=s.next_review&&!dayDiff(s.next_review),overdue=s.next_review&&dayDiff(s.next_review)<=0;return{v,s,status,due,overdue}});
  const newWords=shuffle(scored.filter(x=>x.status==="New")),due=shuffle(scored.filter(x=>x.overdue&&x.status!=="New"&&x.status!=="Mastered")),learning=shuffle(scored.filter(x=>x.status==="Learning"&&!x.overdue)),familiar=shuffle(scored.filter(x=>x.status==="Familiar"&&!x.overdue)),mastered=shuffle(scored.filter(x=>x.status==="Mastered"));
  const chosen=[],add=list=>list.forEach(x=>{if(chosen.length<20&&!chosen.includes(x.v.id))chosen.push(x.v.id)});
  add(newWords.slice(0,10));add(due);add(learning);add(familiar);add(newWords);add(mastered);
  const refill=[...due,...learning,...familiar,...newWords,...mastered].map(x=>x.v.id);for(let i=0;chosen.length<20&&refill.length;i++)chosen.push(refill[i%refill.length]);
  state.vocabStats.daily_plans[today()]=chosen.slice(0,20);save();return state.vocabStats.daily_plans[today()];
}
function nextVocab(){
  const plan=buildDailyVocabPlan(),done=Math.min(state.stats.daily[today()]?.vocab||0,19),id=plan[done];
  return state.vocab.find(v=>v.id===id)||state.vocab[0];
}
function addDays(n){const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}
function updateVocabLearning(s,ok){
  const previous=vocabStatus(s);s.status=ok?(s.correct>=5&&(!s.last_wrong_at||dayDiff(s.last_wrong_at)<=-30)?"Mastered":s.correct>=3&&(!s.last_wrong_at||dayDiff(s.last_wrong_at)<=-7)?"Familiar":"Learning"):(previous==="Mastered"?"Familiar":"Learning");
  if(!ok)s.last_wrong_at=new Date().toISOString();
  const intervals=[1,3,7,14,30],days=ok?intervals[Math.min(Math.max(s.correct,1)-1,4)]:1;s.next_review=addDays(days);
}
function wordFamilyRows(v){
  const names={verb:"動詞",noun:"名詞",adjective:"形容詞",adverb:"副詞",person:"人物"},family=v.word_family||{},pos=vocabPos(v);
  return["verb","noun","adjective","adverb","person"].filter(k=>family[k]&&(family[k]!==v.word||pos.includes(k))).map(k=>`<span><b>${names[k]}</b>${family[k]}</span>`).join("");
}
function verbFormsBlock(v,f){return vocabPos(v).includes("verb")&&v.forms?`<h4>動詞變化</h4><div class="form-grid"><span><b>原形</b>${f.base}</span><span><b>第三人稱</b>${f.third_person}</span><span><b>過去式</b>${f.past}</span><span><b>過去分詞</b>${f.past_participle}</span><span><b>V-ing</b>${f.ing}</span></div>`:""}
function vocabQuestion(){
  let v=nextVocab();if(state.vocabMode==="forms"&&(!v.forms||!vocabPos(v).includes("verb"))){const available=state.vocab.filter(x=>vocabPos(x).includes("verb")&&x.forms?.past&&x.forms?.past_participle);if(available.length)v=available[Math.floor(Math.random()*available.length)]}const others=similarVocab(v);let prompt=v.word,correct=vocabMeaning(v),opts=[];
  if(state.vocabMode==="zh-en"){prompt=`${vocabPosLabel(v)} ${vocabMeaning(v)}`;correct=v.word;opts=[v,...others].map(x=>({value:x.word,label:`${vocabPosLabel(x)}，${x.word}`}))}
  else if(state.vocabMode==="sentence"){prompt=(v.examples?.[0]?.sentence||`Please use ${v.word} correctly.`).replace(new RegExp(v.word,"i"),"_____");correct=v.word;opts=[v,...others].map(x=>({value:x.word,label:x.word}))}
  else if(state.vocabMode==="pos"){prompt=`${v.word} 最常見的詞性是？`;correct=vocabPos(v)[0]||Object.keys(v.word_family||{}).find(x=>v.word_family[x])||"word";opts=[correct,"noun","verb","adjective","adverb"].filter((x,i,a)=>a.indexOf(x)===i).slice(0,4).map(x=>({value:x,label:posShort[x]||x}))}
  else if(state.vocabMode==="forms"){const f=formsFor(v);prompt=`${v.word} 的過去式是？`;correct=f.past;opts=[correct,f.base,f.third_person,f.ing].filter((x,i,a)=>a.indexOf(x)===i).map(x=>({value:x,label:x}))}
  else opts=[v,...others].map(x=>({value:vocabMeaning(x),label:`${vocabPosLabel(x)} ${vocabMeaning(x)}`}));
  state.vocabQuestion={v,correct,answered:false,selected:null};$("#vocabPractice").innerHTML=`<article class="card practice-card"><span class="chip">${state.vocabMode}</span><p class="question">${prompt}</p><div class="options">${shuffle(opts).map((x,i)=>`<button type="button" class="option" data-value="${x.value}">${x.label}</button>`).join("")}</div><button type="button" class="primary submit-answer" id="submitVocab" disabled>請選擇一個答案</button><div id="vResult"></div></article>`;$("#vocabPractice .options").onclick=e=>{const b=e.target.closest(".option");if(!b||state.vocabQuestion.answered)return;$("#vocabPractice").querySelectorAll(".option").forEach(x=>x.classList.toggle("selected",x===b));state.vocabQuestion.selected=b.dataset.value;$("#submitVocab").disabled=false;$("#submitVocab").textContent="提交答案"};$("#submitVocab").onclick=()=>{if(state.vocabQuestion.selected===null||state.vocabQuestion.answered)return;state.vocabQuestion.answered=true;$("#submitVocab").disabled=true;answerVocab(state.vocabQuestion.selected)}
}
function answerVocab(a){const{v,correct}=state.vocabQuestion,ok=a===correct,s=state.vocabStats.words[v.id]||{attempts:0,correct:0,wrong:0,wrong_streak:0,status:"New"};s.attempts++;ok?s.correct++:s.wrong++;s.wrong_streak=ok?0:(s.wrong_streak||0)+1;s.accuracy=Math.round(s.correct/s.attempts*100);s.mastery=s.accuracy;s.last_practiced=new Date().toISOString();updateVocabLearning(s,ok);state.vocabStats.words[v.id]=s;state.stats.daily[today()]={...(state.stats.daily[today()]||{}),vocab:Math.min(20,(state.stats.daily[today()]?.vocab||0)+1)};updateStreak();save();checkRewards();renderDashboard();renderGrowth();renderFamily();updateProgressWidgets();const f=formsFor(v),family=wordFamilyRows(v),example=v.examples?.find(x=>x.sentence)?.sentence,collocations=(v.common_collocations||[]).filter(Boolean);$("#vocabPractice").querySelectorAll(".option").forEach(b=>{b.disabled=true;b.classList.toggle("correct",b.dataset.value===correct);b.classList.toggle("wrong",b.dataset.value===a&&!ok)});$("#submitVocab").classList.add("hidden");$("#vResult").innerHTML=`<div class="result ${ok?"good":"bad"}">${ok?"答對":"答錯"} · ${correct}</div><button type="button" class="primary next-vocab" id="nextV">下一題</button><div class="details vocab-analysis" id="vDetails"><h3>${v.word}</h3><p><b>詞性：</b>${vocabPosLabel(v)}<br><b>意思：</b>${vocabMeaning(v)}</p>${verbFormsBlock(v,f)}${family?`<h4>詞性變化</h4><div class="form-grid">${family}</div>`:""}${example?`<p><b>例句：</b>${example}</p>`:""}${collocations.length?`<p><b>常見搭配：</b>${collocations.join("；")}</p>`:""}<p><b>熟悉度：</b>${vocabStatus(s)}<br><b>下次複習：</b>${s.next_review}</p></div>`;$("#nextV").onclick=vocabQuestion}
function renderReading(){
  if(state.user.level==="junior"&&state.pastPapers){$("#reading").innerHTML=`<section class="panel"><h3>會考歷屆閱讀</h3><p>已建立 ${state.pastPapers.years.join("、")} 年來源庫，共 ${state.pastPapers.total_declared_questions} 題。</p><div class="past-paper-grid">${state.pastPapers.papers.map(p=>`<article><b>${p.year} 年</b><span>${p.declared_questions} 題</span><small>答案 ${p.answer_key_count}/${p.declared_questions} 已核對</small></article>`).join("")}</div><small>題目正在依「單題／題組／知識點」整理，完成核對後开放练习。</small></section>`;return}
  $("#reading").innerHTML=`<div class="card"><h3>閱讀中心</h3><p>V1 保留框架。未來新增 data/reading_${state.user.level}.json 即可自動擴充。</p></div>`
}

function renderMistakes(){const grammar=Object.values(state.stats.mistakes),wrongWords=state.vocab.filter(v=>state.vocabStats.words[v.id]?.wrong);$("#mistakesPage").innerHTML=`<div class="section-title"><h2>錯題本</h2><button class="primary" id="retryWeak">重新挑战薄弱项目</button></div><h3>文法錯題</h3>${grammar.map(x=>`<div class="card">${x.question.category} · 答錯 ${x.wrong} 次<br><b>${x.question.question}</b></div>`).join("")||'<div class="card">暂無文法錯題</div>'}<h3>單字錯題</h3>${wrongWords.map(v=>`<div class="vocab-item"><b>${v.word}</b><span>${v.chinese}</span></div>`).join("")||'<div class="card">暂無單字錯題</div>'}`;$("#retryWeak").onclick=()=>{state.grammarMode=grammar.length?"mistakes":"weak";showPage("learnPage");renderLearn()}}
function renderGrowth(){
  const vs=Object.values(state.vocabStats.words),vAcc=vs.length?Math.round(vs.reduce((s,x)=>s+x.accuracy,0)/vs.length):0;
  const vocabPools={New:0,Learning:0,Familiar:0,Mastered:0};state.vocab.forEach(v=>vocabPools[vocabStatus(state.vocabStats.words[v.id])]++);
  const ks=knowledgeSummary();
  const categories={};state.knowledge.forEach(k=>{const s=state.stats.knowledge[k.id];if(!s?.attempts)return;const c=categories[k.category]||{attempts:0,correct:0};c.attempts+=s.attempts;c.correct+=s.correct;categories[k.category]=c});
  const categoryHtml=Object.entries(categories).map(([c,s])=>`<div class="stat category-stat"><span>${c}</span><strong>${s.attempts<3?"待觀察":`${Math.round(s.correct/s.attempts*100)}%`}</strong><small>練習 ${s.attempts} 題 · ${status({...s,accuracy:Math.round(s.correct/s.attempts*100)})}</small></div>`).join("")||'<div class="card">完成練習後顯示分類正確率</div>';
  const knowledgeHtml=state.knowledge.map(k=>{const s=state.stats.knowledge[k.id]||{attempts:0,correct:0,wrong:0,accuracy:0,mastery:0};return`<div class="card knowledge-card"><div><b>${k.formula||k.id}</b><span>${k.category}</span></div><strong>${accuracyText(s)} · ${status(s)}</strong><small>練習 ${s.attempts} 題 · 最近練習 ${s.last_practiced?new Date(s.last_practiced).toLocaleDateString():"尚未練習"}</small><div class="progress"><span style="width:${s.attempts>=3?s.mastery||0:0}%"></span></div></div>`}).join("");
  const suggestions=weakestKnowledge(3).map((x,i)=>`<li><b>${["①","②","③"][i]} ${x.k.formula||x.k.id}</b><span>${x.s.attempts?`${accuracyText(x.s)} · ${status(x.s)}`:"從未練習，優先建立基础"}</span></li>`).join("");
  const overall=state.stats.attempts<3?"待觀察":`${Math.round(state.stats.correct/state.stats.attempts*100)}%`,ss=silviaScores({stats:state.stats,vocab:state.vocabStats});
  $("#growthPage").innerHTML=`<div class="section-title"><h2>成長</h2><button class="primary" id="practiceWeak">練習薄弱知識點</button></div>${state.user.id==="silvia"?`<section class="panel score-panel"><h3>TOEIC Reading 成長</h3><div class="score-row"><span>目前 Reading<b>${ss.reading}</b><small>起始基準 ${ss.baseReading}</small></span><span>Reading 目標<b>${ss.targetReading}</b><small>滿分目標</small></span><span>尚差<b>${ss.remaining}</b><small>分</small></span></div><div class="goal-progress"><i style="width:${ss.progress}%"></i></div><small>Listening ${ss.listening} 為固定參考，本模組只追蹤 Reading 成長。</small></section>`:""}<div class="stats-grid"><div class="stat"><span>文法正確率</span><strong>${overall}</strong></div><div class="stat"><span>單字熟悉度</span><strong>${vs.length<3?"待觀察":`${vAcc}%`}</strong></div><div class="stat"><span>累計完成題數</span><strong>${state.stats.attempts}</strong></div><div class="stat"><span>連續學習</span><strong>${state.stats.streak} 天</strong></div></div><section class="panel"><h3>知識點總覽</h3><div class="knowledge-pools"><span class="kp-mastered"><b>${ks.mastered}</b>已掌握</span><span class="kp-weak"><b>${ks.weak}</b>薄弱</span><span class="kp-unlearned"><b>${ks.unlearned}</b>未學習</span><span class="kp-learning"><b>${ks.learning}</b>學習中</span></div><small>目前 ${ks.total} 個知識點，${ks.covered} 個已有題目；${ks.underFive} 個尚未達到每點 5 題。</small></section><section class="panel"><h3>單字池</h3><div class="vocab-pools">${Object.entries(vocabPools).map(([k,n])=>`<span class="pool-${k.toLowerCase()}"><b>${n}</b>${k}</span>`).join("")}</div></section><section class="panel advice"><h3>今日建議</h3><ol>${suggestions}</ol></section><h3>分類統計</h3><div class="stats-grid">${categoryHtml}</div><h3>知識點熟悉度</h3>${knowledgeHtml}<section class="panel"><h3>歷史曲線</h3><p>近30天正確率與近90天學習時數將在後續資料累積後顯示。</p></section>`;
  $("#practiceWeak").onclick=()=>{state.grammarMode="weak";showPage("learnPage");renderLearn()};
}
function renderFamily(){$("#familyPage").innerHTML=`<div class="section-title"><h2>家庭</h2></div><section class="panel"><h3>家庭挑战</h3><p>每周 420 個單字、420 題文法、10.5 小時學習。</p></section><section class="panel"><h3>家庭排行榜</h3>${leaderboardHtml()}</section><section class="panel"><h3>切换學習者</h3>${state.users.map(u=>`<button class="secondary switch" data-user="${u.id}">${u.name}</button>`).join(" ")}</section><section class="panel"><h3>安裝與設定</h3><p>可安裝到 Android 或 iPhone 主画面；首次联網打開後支持離線使用。</p></section>`;$("#familyPage").querySelectorAll(".switch").forEach(b=>b.onclick=()=>activateUser(state.users.find(u=>u.id===b.dataset.user)))}
function renderAll(){renderDashboard();renderLearn();renderMistakes();renderGrowth();renderFamily()}
function updateStreak(){const dates=new Set([...Object.keys(state.stats.daily),...Object.values(state.vocabStats.words).map(x=>x.last_practiced?.slice(0,10)).filter(Boolean)]);let n=0,d=new Date();while(dates.has(d.toISOString().slice(0,10))){n++;d.setDate(d.getDate()-1)}state.stats.streak=n}
function setupInstall(){let prompt;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();prompt=e;$("#installButton").classList.remove("hidden")});$("#installButton").onclick=()=>prompt?.prompt();if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js"))}
init();





























