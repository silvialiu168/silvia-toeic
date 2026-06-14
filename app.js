const DATA="data/", $=s=>document.querySelector(s);
const state={users:[],user:null,questions:[],knowledge:[],vocab:[],stats:null,vocabStats:null,current:null,vocabQuestion:null,grammarMode:"smart",vocabMode:"en-zh"};
const today=()=>new Date().toISOString().slice(0,10);
const read=k=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}};
const emptyStats=()=>({attempts:0,correct:0,wrong:0,mistakes:{},knowledge:{},daily:{},minutes:0,streak:0});
const emptyVocab=()=>({words:{},favorites:[]});
const normalizeStats=s=>({...emptyStats(),...(s||{}),mistakes:s?.mistakes||{},knowledge:s?.knowledge||{},daily:s?.daily||{}});
const userData=u=>({stats:normalizeStats(read(u.stats_key)),vocab:read(u.vocab_key)||emptyVocab()});
const points=u=>{const d=userData(u);return d.stats.correct*10+Object.values(d.vocab.words).reduce((s,x)=>s+(x.correct||0)*5,0)};
async function json(f){return(await fetch(DATA+f)).json()}
function save(){localStorage.setItem(state.user.stats_key,JSON.stringify(state.stats));localStorage.setItem(state.user.vocab_key,JSON.stringify(state.vocabStats))}

async function init(){
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
  state.user=u;({stats:state.stats,vocab:state.vocabStats}=userData(u));const knowledge=[...await json("knowledge_common.json"),...await json(`knowledge_${u.level}.json`)];state.knowledge=[...new Map(knowledge.map(k=>[k.id,k])).values()];state.questions=await json(`questions_${u.level}.json`);state.vocab=await json(`vocab_${u.level}.json`);
  $("#pageTitle").textContent=`${u.name} · ${u.goal}`;renderAll();if(openLearn)showPage("learnPage");
}
function setupNav(){$("#bottomNav").classList.remove("hidden");$("#bottomNav").onclick=e=>{const b=e.target.closest("button");if(b)showPage(b.dataset.page)};$("#homeButton").onclick=()=>showPage("dashboardPage")}
function showPage(id){$("#familyView").classList.add("hidden");$("#learnerView").classList.remove("hidden");document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===id));document.querySelectorAll("#bottomNav button").forEach(x=>x.classList.toggle("active",x.dataset.page===id));$("#pageTitle").textContent=id==="dashboardPage"?"Family English Challenge":`${state.user.name} · ${state.user.goal}`;if(id==="dashboardPage")renderDashboard()}
function progressFor(u,d){const done=d.stats.attempts+Object.values(d.vocab.words).reduce((s,x)=>s+x.attempts,0);return Math.min(100,Math.round(done/100*100))}
function stageNext(u){const i=u.stages.indexOf(u.current_stage);return u.stages[Math.min(i+1,u.stages.length-1)]}
function todayData(u,d){const grammar=d.stats.daily[today()]?.grammar||0,vocab=Object.values(d.vocab.words).filter(x=>x.last_practiced?.startsWith(today())).length;return{grammar,vocab,minutes:d.stats.minutes||0}}
function weakestKnowledge(limit=5){
  return state.knowledge.map(k=>({k,s:state.stats.knowledge[k.id]||{attempts:0,accuracy:0,mastery:0}})).sort((a,b)=>{
    if(a.s.attempts===0&&b.s.attempts>0)return 1;
    if(b.s.attempts===0&&a.s.attempts>0)return-1;
    return a.s.accuracy-b.s.accuracy||b.s.attempts-a.s.attempts;
  }).slice(0,limit);
}
function renderDashboard(){
  $("#familyView").classList.add("hidden");const p=$("#dashboardPage");p.innerHTML=`<div class="hero"><p>距离目标还差多少？</p><div class="family-score"><strong>${state.users.filter(u=>{const t=todayData(u,userData(u));return t.vocab>=20&&t.grammar>=20&&t.minutes>=30}).length}</strong><span>今日完成人数</span></div></div><div class="dashboard-users">${state.users.map(u=>{const d=userData(u),t=todayData(u,d),progress=progressFor(u,d);return`<button class="user-card" data-user="${u.id}"><strong>${u.name}</strong><span>${u.goal}</span><div class="user-progress"><i style="width:${progress}%"></i></div><small>${progress}% · 目前：${u.current_stage} · 下一阶段：${stageNext(u)}</small><div class="dashboard-line"><span>${t.vocab>=20?"✅":"⏳"} 单字 ${t.vocab}/20</span><span>${t.grammar>=20?"✅":"⏳"} 文法 ${t.grammar}/20</span></div><small>${t.minutes>=30?"✅":"⏳"} 学习 ${t.minutes}/30 分钟 · 累计已做 ${d.stats.attempts} 题</small></button>`}).join("")}</div><section class="panel"><h2>家庭排行榜</h2>${leaderboardHtml()}</section>`;
  p.querySelectorAll("[data-user]").forEach(b=>b.onclick=()=>activateUser(state.users.find(u=>u.id===b.dataset.user)));
}
function leaderboardHtml(){return[...state.users].sort((a,b)=>points(b)-points(a)).map((u,i)=>`<div class="rank-row"><b>${["🥇","🥈","🥉"][i]}</b><span>${u.name}</span><strong>${points(u)} 分</strong></div>`).join("")}

function renderLearn(){
  $("#learnPage").innerHTML=`<div class="tabs"><button class="active" data-tab="grammar">文法</button><button data-tab="vocab">单字</button><button data-tab="reading">阅读</button></div><section id="grammar" class="learn-section active"></section><section id="vocab" class="learn-section"></section><section id="reading" class="learn-section"></section>`;
  $("#learnPage .tabs").onclick=e=>{const b=e.target.closest("button");if(!b)return;$("#learnPage").querySelectorAll(".tabs button").forEach(x=>x.classList.toggle("active",x===b));$("#learnPage").querySelectorAll(".learn-section").forEach(x=>x.classList.toggle("active",x.id===b.dataset.tab))};
  renderGrammar();renderVocab();renderReading();
}
function grammarPool(){
  if(state.grammarMode==="mistakes"){
    const ids=new Set(Object.keys(state.stats.mistakes).map(String));
    return state.questions.filter(q=>ids.has(String(q.id)));
  }
  if(state.grammarMode==="weak"){
    const weakIds=Object.entries(state.stats.knowledge).filter(([,s])=>s.attempts>=1&&s.accuracy<60).map(([id])=>id);
    return state.questions.filter(q=>weakIds.includes(q.knowledge_id||q.knowledgeId));
  }
  if(state.grammarMode==="smart"){
    const weighted=[];
    state.questions.forEach(q=>{
      const s=state.stats.knowledge[q.knowledge_id||q.knowledgeId];
      const weight=!s?2:s.accuracy<60?5:s.accuracy<85?3:1;
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
  const pool=grammarPool(),labels={smart:"智能练习",weak:"薄弱知识点",random:"随机练习",mistakes:"错题重练"};
  if(!pool.length){$("#grammar").innerHTML=`<div class="chips">${Object.entries(labels).map(([m,l])=>`<button class="chip ${state.grammarMode===m?"active":""}" data-mode="${m}">${l}</button>`).join("")}</div><article class="card"><h3>目前没有可练习的题目</h3><p>先完成一些随机练习，系统就能找出需要加强的知识点。</p></article>`;$("#grammar .chips").onclick=e=>{const b=e.target.closest("[data-mode]");if(b)setGrammarMode(b.dataset.mode)};return}
  state.current=pool[Math.floor(Math.random()*pool.length)];const q=state.current;
  $("#grammar").innerHTML=`<div class="chips">${Object.entries(labels).map(([m,l])=>`<button class="chip ${state.grammarMode===m?"active":""}" data-mode="${m}">${l}</button>`).join("")}</div><article class="card"><span class="chip">${q.category}</span><p class="question">${q.question}</p><div class="options">${q.options.map((o,i)=>`<button class="option" data-i="${i}">${String.fromCharCode(65+i)}. ${o}</button>`).join("")}</div><div id="grammarResult"></div></article>`;
  $("#grammar .chips").onclick=e=>{const b=e.target.closest("[data-mode]");if(b)setGrammarMode(b.dataset.mode)};
  $("#grammar .options").onclick=e=>{const b=e.target.closest(".option");if(b&&!$("#grammar").dataset.locked){$("#grammar").dataset.locked=1;answerGrammar(Number(b.dataset.i))}};
}
function answerGrammar(i){
  const q=state.current,ok=i===q.answer,k=q.knowledge_id||q.knowledgeId,now=new Date().toISOString(),s=state.stats.knowledge[k]||{attempts:0,correct:0,wrong:0};state.stats.attempts++;ok?state.stats.correct++:state.stats.wrong++;s.attempts++;ok?s.correct++:s.wrong++;s.accuracy=Math.round(s.correct/s.attempts*100);s.mastery=s.accuracy;s.last_practiced=now;state.stats.knowledge[k]=s;if(!ok)state.stats.mistakes[q.id]={question:q,wrong:(state.stats.mistakes[q.id]?.wrong||0)+1};state.stats.daily[today()]={...(state.stats.daily[today()]||{}),grammar:(state.stats.daily[today()]?.grammar||0)+1};updateStreak();save();
  renderDashboard();renderGrowth();renderMistakes();renderFamily();
  $("#grammarResult").innerHTML=`<div class="result ${ok?"good":"bad"}">${ok?"答对":"答错"} · 正确答案 ${q.options[q.answer]} · 累计已做 ${state.stats.attempts} 题</div><div class="actions"><button class="secondary" id="teacher">Silvia 老师讲题</button><button class="primary" id="nextG">下一题</button></div><div id="analysis" class="teacher-analysis hidden">${teacherAnalysis(q,i,ok)}</div>`;$("#teacher").onclick=()=>$("#analysis").classList.toggle("hidden");$("#nextG").onclick=()=>{delete $("#grammar").dataset.locked;renderGrammar()};
}
function optionReason(q,o,i){
  if(i===q.answer)return"这是正确答案：放回句子后，结构完整，意思也自然。";
  const c=q.category||"",lower=String(o).toLowerCase();
  if(c.includes("词性"))return`“${o}”的词性不符合空格位置。先找出空格要修饰或补充的对象，再选正确词形。`;
  if(c.includes("前置词")||c.includes("介词")){
    const meanings={of:"表示所属或组成",at:"表示具体地点或时间点",from:"表示来源或起点",with:"表示 همراه、使用工具或具有",between:"表示两者之间",among:"表示一群之中",for:"表示对象、用途或目的",to:"表示方向，也可能是固定搭配的一部分",in:"表示在范围、地点或时间内",on:"表示在表面或特定日期"};
    return `${meanings[lower]||"它表达的关系"}，与这句话空格前后的关系不一致。`;
  }
  if(c.includes("连接词"))return`“${o}”连接句子时表达的逻辑关系不符合上下文；要先判断两边是原因、对比、条件还是时间。`;
  if(c.includes("主谓一致"))return`“${o}”没有跟真正的主词保持一致；先忽略插入说明，再看主词是单数还是复数。`;
  if(c.includes("关系代名词"))return`“${o}”不能同时符合先行词是人或物，以及空格在后半句承担的作用。`;
  return `“${o}”放回整句后，和空格需要的形式或上下文意思不匹配。`;
}
function teacherAnalysis(q,chosen,ok){const k=state.knowledge.find(x=>x.id===(q.knowledge_id||q.knowledgeId))||{},parts=q.question.split("_____"),wrong=q.options.map((o,i)=>`<div class="option-reason"><b>${o}</b>：${optionReason(q,o,i)}</div>`).join("");return`${ok?"":`<section class="teacher-step mistake"><h4>你为什么容易选错？</h4><p>你选择了 <b>${q.options[chosen]}</b>。常见误区是只看单字感觉，没有放回整句检查。下次先看空格前后，再判断句意关系。</p></section>`}<section class="teacher-step"><h4>Step 1：先看空格需要什么</h4><p>空格前是 <b>${parts[0]}</b>，后面是 <b>${parts[1]||"句尾"}</b>。先判断需要动作、描述词，还是连接两边内容的词。</p></section><section class="teacher-step"><h4>Step 2：把句子拆开理解</h4><p>前半句：${parts[0]}<br>后半句：${parts[1]||"无"}</p></section><section class="teacher-step"><h4>Step 3：分析句意</h4><p>${q.explanation}</p></section><section class="teacher-step"><h4>Step 4：正确答案为什么对</h4><p>${k.rule||q.explanation}<br><b>${q.question.replace("_____",q.options[q.answer])}</b></p></section><section class="teacher-step"><h4>Step 5：逐一排除选项</h4>${wrong}</section><section class="teacher-step related"><h4>Step 6：相关知识</h4><p>${k.formula||q.category}<br>${k.example||""}<br>${k.common_error||""}</p></section><section class="teacher-step"><h4>Step 7：下次怎么判断</h4><p>这是 ${state.user.goal} 的 ${q.category} 考法。先看结构，再看句意，最后把答案放回整句检查。</p></section>`}

function status(s){if(!s||s.attempts<3)return"样本不足";return s.accuracy>=85?"熟悉":s.accuracy>=60?"待加强":"薄弱"}
function renderVocab(){const modes={"en-zh":"英文选中文","zh-en":"中文选英文",sentence:"例句填空",pos:"词性判断",forms:"词形变化"};$("#vocab").innerHTML=`<div class="chips">${Object.entries(modes).map(([m,l])=>`<button class="chip ${state.vocabMode===m?"active":""}" data-vmode="${m}">${l}</button>`).join("")}</div><div id="vocabPractice"></div><h3>单词本</h3><div class="vocab-list">${state.vocab.map(v=>`<div class="vocab-item"><strong>${v.word}</strong><span>${v.chinese}</span><small>${status(state.vocabStats.words[v.id])} · ${state.vocabStats.words[v.id]?.accuracy||0}%</small></div>`).join("")}</div>`;$("#vocab .chips").onclick=e=>{const b=e.target.closest("[data-vmode]");if(!b)return;state.vocabMode=b.dataset.vmode;renderVocab();vocabQuestion()};vocabQuestion()}
function shuffle(a){return[...a].sort(()=>Math.random()-.5)}
function formsFor(v){
  const w=v.word,original=v.forms||{},past=original.past===`${w}ed`&&w.endsWith("e")?`${w}d`:original.past||`${w}ed`,ing=original.ing===`${w}ing`&&w.endsWith("e")?`${w.slice(0,-1)}ing`:original.ing||`${w}ing`;
  return{base:original.base||w,third_person:original.third_person||`${w}s`,past,past_participle:original.past_participle===`${w}ed`&&w.endsWith("e")?`${w}d`:original.past_participle||past,ing};
}
function vocabQuestion(){
  const v=state.vocab[Math.floor(Math.random()*state.vocab.length)],others=shuffle(state.vocab.filter(x=>x.id!==v.id)).slice(0,3);let prompt=v.word,correct=v.chinese,opts=[];
  if(state.vocabMode==="zh-en"){prompt=v.chinese;correct=v.word;opts=[correct,...others.map(x=>x.word)]}
  else if(state.vocabMode==="sentence"){prompt=(v.examples?.[0]?.sentence||`Please use ${v.word} correctly.`).replace(new RegExp(v.word,"i"),"_____");correct=v.word;opts=[correct,...others.map(x=>x.word)]}
  else if(state.vocabMode==="pos"){prompt=`${v.word} 最常见的词性是？`;correct=(v.part_of_speech||[]).find(x=>x!=="word")||Object.keys(v.word_family||{}).find(x=>v.word_family[x])||"word";opts=[correct,"noun","verb","adjective","adverb"].filter((x,i,a)=>a.indexOf(x)===i).slice(0,4)}
  else if(state.vocabMode==="forms"){const f=formsFor(v);prompt=`${v.word} 的过去式是？`;correct=f.past;opts=[correct,f.base,f.third_person,f.ing].filter((x,i,a)=>a.indexOf(x)===i)}
  else opts=[correct,...others.map(x=>x.chinese)];
  state.vocabQuestion={v,correct,answered:false};$("#vocabPractice").innerHTML=`<article class="card"><span class="chip">${state.vocabMode}</span><p class="question">${prompt}</p><div class="options">${shuffle(opts).map(x=>`<button class="option">${x}</button>`).join("")}</div><div id="vResult"></div></article>`;$("#vocabPractice .options").onclick=e=>{const b=e.target.closest(".option");if(b&&!state.vocabQuestion.answered){state.vocabQuestion.answered=true;answerVocab(b.textContent)}}
}
function answerVocab(a){const{v,correct}=state.vocabQuestion,ok=a===correct,s=state.vocabStats.words[v.id]||{attempts:0,correct:0,wrong:0};s.attempts++;ok?s.correct++:s.wrong++;s.accuracy=Math.round(s.correct/s.attempts*100);s.mastery=s.accuracy;s.last_practiced=new Date().toISOString();state.vocabStats.words[v.id]=s;updateStreak();save();renderDashboard();renderGrowth();renderFamily();const f=formsFor(v);$("#vResult").innerHTML=`<div class="result ${ok?"good":"bad"}">${ok?"答对":"答错"} · ${correct}</div><div class="details">${v.word}：${v.chinese}<br>词性：${(v.part_of_speech||[]).join(" / ")}<br>词形：${f.base} / ${f.third_person} / ${f.past} / ${f.past_participle} / ${f.ing}<br>${v.examples[0].sentence}<br>常见搭配：${(v.common_collocations||[]).join("；")}<br>${v.common_error}</div><button class="primary" id="nextV">下一词</button>`;$("#nextV").onclick=vocabQuestion}
function renderReading(){$("#reading").innerHTML=`<div class="card"><h3>阅读中心</h3><p>V1 保留框架。未来新增 data/reading_${state.user.level}.json 即可自动扩充。</p></div>`}

function renderMistakes(){const grammar=Object.values(state.stats.mistakes),wrongWords=state.vocab.filter(v=>state.vocabStats.words[v.id]?.wrong);$("#mistakesPage").innerHTML=`<div class="section-title"><h2>错题本</h2><button class="primary" id="retryWeak">重新挑战薄弱项目</button></div><h3>文法错题</h3>${grammar.map(x=>`<div class="card">${x.question.category} · 答错 ${x.wrong} 次<br><b>${x.question.question}</b></div>`).join("")||'<div class="card">暂无文法错题</div>'}<h3>单字错题</h3>${wrongWords.map(v=>`<div class="vocab-item"><b>${v.word}</b><span>${v.chinese}</span></div>`).join("")||'<div class="card">暂无单字错题</div>'}`;$("#retryWeak").onclick=()=>{state.grammarMode=grammar.length?"mistakes":"weak";showPage("learnPage");renderLearn()}}
function renderGrowth(){
  const vs=Object.values(state.vocabStats.words),vAcc=vs.length?Math.round(vs.reduce((s,x)=>s+x.accuracy,0)/vs.length):0;
  const categories={};state.knowledge.forEach(k=>{const s=state.stats.knowledge[k.id];if(!s?.attempts)return;(categories[k.category]??=[]).push(s.accuracy)});
  const categoryHtml=Object.entries(categories).map(([c,a])=>`<div class="stat"><span>${c}</span><strong>${Math.round(a.reduce((x,y)=>x+y,0)/a.length)}%</strong></div>`).join("")||'<div class="card">完成练习后显示分类正确率</div>';
  const knowledgeHtml=state.knowledge.map(k=>{const s=state.stats.knowledge[k.id]||{attempts:0,correct:0,wrong:0,accuracy:0,mastery:0};return`<div class="card knowledge-card"><div><b>${k.formula||k.id}</b><span>${k.category}</span></div><strong>${s.accuracy}% · ${status(s)}</strong><small>作答 ${s.attempts} 次 · 最近练习 ${s.last_practiced?new Date(s.last_practiced).toLocaleDateString():"尚未练习"}</small><div class="progress"><span style="width:${s.mastery||0}%"></span></div></div>`}).join("");
  $("#growthPage").innerHTML=`<div class="section-title"><h2>成长</h2><button class="primary" id="practiceWeak">练习薄弱知识点</button></div><div class="stats-grid"><div class="stat"><span>文法正确率</span><strong>${state.stats.attempts?Math.round(state.stats.correct/state.stats.attempts*100):0}%</strong></div><div class="stat"><span>单字熟悉度</span><strong>${vAcc}%</strong></div><div class="stat"><span>累计完成题数</span><strong>${state.stats.attempts}</strong></div><div class="stat"><span>连续打卡</span><strong>${state.stats.streak} 天</strong></div></div><h3>分类平均正确率</h3><div class="stats-grid">${categoryHtml}</div><h3>知识点熟悉度</h3>${knowledgeHtml}<section class="panel"><h3>历史曲线</h3><p>近30天正确率与近90天学习时数将在后续数据累积后显示。</p></section>`;
  $("#practiceWeak").onclick=()=>{state.grammarMode="weak";showPage("learnPage");renderLearn()};
}
function renderFamily(){$("#familyPage").innerHTML=`<div class="section-title"><h2>家庭</h2></div><section class="panel"><h3>家庭挑战</h3><p>每周 420 个单字、420 题文法、10.5 小时学习。</p></section><section class="panel"><h3>家庭排行榜</h3>${leaderboardHtml()}</section><section class="panel"><h3>切换学习者</h3>${state.users.map(u=>`<button class="secondary switch" data-user="${u.id}">${u.name}</button>`).join(" ")}</section><section class="panel"><h3>安装与设置</h3><p>可安装到 Android 或 iPhone 主画面；首次联网打开后支持离线使用。</p></section>`;$("#familyPage").querySelectorAll(".switch").forEach(b=>b.onclick=()=>activateUser(state.users.find(u=>u.id===b.dataset.user)))}
function renderAll(){renderDashboard();renderLearn();renderMistakes();renderGrowth();renderFamily()}
function updateStreak(){const dates=new Set([...Object.keys(state.stats.daily),...Object.values(state.vocabStats.words).map(x=>x.last_practiced?.slice(0,10)).filter(Boolean)]);let n=0,d=new Date();while(dates.has(d.toISOString().slice(0,10))){n++;d.setDate(d.getDate()-1)}state.stats.streak=n}
function setupInstall(){let prompt;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();prompt=e;$("#installButton").classList.remove("hidden")});$("#installButton").onclick=()=>prompt?.prompt();if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js"))}
init();
