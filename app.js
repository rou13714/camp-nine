/* ================= DATA ================= */
const SWATCHES = ['#3F6B4F','#C1573D','#D9A441','#4472A8','#9A4E8A'];
const MODE_COLORS = {home:'#2E4F3A', bingo:'#C1573D', solo:'#B8862E'};

// 8 confirmed games, center cell is shared/free (not a game)
const GAMES = [
  {id:'intro', name:'聽前奏猜歌', pun:'5秒定律', cat:'music', color:'#4472A8',
    packs:[{id:'p1',name:'8年級金曲',qs:['示範：播放一段前奏，猜出歌名','示範：再放一段前奏']},
           {id:'p2',name:'2000歐美金曲',qs:['示範：播放英文歌前奏猜歌名']}]},
  {id:'google', name:'谷歌小姐念歌詞猜歌', pun:'A~我聽不懂', cat:'music', color:'#9A4E8A',
    packs:[{id:'p1',name:'華語2000年金曲',qs:['一言一語 是指定旋律 陪我到哪條路遊來遊去（蕭亞軒〈愛的主打歌〉）','感謝地心引力讓我碰到你（周杰倫〈可愛女人〉）']},
           {id:'p2',name:'歐美金曲',qs:["I'm in love with the shape of you（Ed Sheeran〈Shape of You〉）"]}]},
  {id:'zhuyin', name:'注音符號拆歌名猜謎', pun:'注定猜不到', cat:'music', color:'#3F6B4F',
    packs:[{id:'p1',name:'華語歌名',qs:['示範：ㄞˋ ㄉㄜ ㄓㄨˇ ㄉㄚˇ ㄍㄜ → 愛的主打歌']}]},
  {id:'silhouette', name:'圖片剪影', pun:'黑影幢幢', cat:'other', color:'#2A2A2A',
    packs:[{id:'p1',name:'動漫角色',qs:['🖼️［剪影圖待補］卡比獸','🖼️［剪影圖待補］史迪奇','🖼️［剪影圖待補］柯南']}]},
  {id:'logo', name:'看logo找出正確的', pun:'lo go厲害（有夠厲害）', cat:'logo', color:'#D9784A',
    packs:[{id:'p1',name:'找對的招牌',qs:['🖼️［logo圖待補］指定一個字，找出所有含該字的正確logo']}]},
  {id:'drama', name:'看劇片段挑戰', pun:'劇不可失', cat:'other', color:'#2E7D6B',
    packs:[{id:'p1',name:'猜劇名',qs:['🎬［影片片段待補］猜出這是哪部劇']},
           {id:'p2',name:'接台詞',qs:['🎬［影片片段待補］接下一句台詞']}]},
  {id:'sameword', name:'同字品牌', pun:'字字都是你', cat:'logo', color:'#C79A2E',
    packs:[{id:'p1',name:'共用一字',qs:['「台」：找出所有以台開頭的品牌（台灣虎航／台灣啤酒／台灣高鐵...）','「大」：大同／大苑子／大潤發／大愛／台灣大車隊']}]},
  {id:'color', name:'品牌顏色', pun:'見色不忘義', cat:'logo', color:'#B4444A',
    packs:[{id:'p1',name:'只看顏色',qs:['🎨［配色圖待補］全聯','🎨［配色圖待補］7-11','🎨［配色圖待補］Microsoft']}]},
];

/* ================= STATE ================= */
let state = {
  bingo:{nameA:'A隊',nameB:'B隊',colorA:SWATCHES[0],colorB:SWATCHES[1], firstPicker:'A', turn:'A',
         cells:new Array(9).fill(null)},
  solo:{nameA:'A隊',nameB:'B隊',colorA:SWATCHES[0],colorB:SWATCHES[1]},
};
let soloMode='team';
let currentGame=null, currentPack=null;
let playScore={A:0,B:0};
let soloQueue=[], soloQIdx=0, soloScore={A:0,B:0};
let activeCellIndex=null, correctionIndex=null;
const CENTER_INDEX = 4;

/* ================= NAV & COLOR ================= */
function go(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function setBaseColor(mode){
  document.body.style.backgroundColor = MODE_COLORS[mode];
}
function setGameColor(game){
  document.body.style.backgroundColor = game.color;
}

/* ================= swatches ================= */
function renderSwatches(containerId, team, target){
  const el = document.getElementById(containerId);
  el.innerHTML='';
  SWATCHES.forEach(c=>{
    const d=document.createElement('div');
    d.className='swatch'+(state[target][team==='A'?'colorA':'colorB']===c?' selected':'');
    d.style.background=c;
    d.onclick=()=>{
      state[target][team==='A'?'colorA':'colorB']=c;
      renderSwatches(containerId, team, target);
    };
    el.appendChild(d);
  });
}
renderSwatches('bingoSwatchA','A','bingo');
renderSwatches('bingoSwatchB','B','bingo');
renderSwatches('soloSwatchA','A','solo');
renderSwatches('soloSwatchB','B','solo');

/* ================= BINGO: setup -> fill ================= */
function startBingoFill(){
  state.bingo.nameA = document.getElementById('bingoNameA').value.trim() || 'A隊';
  state.bingo.nameB = document.getElementById('bingoNameB').value.trim() || 'B隊';
  go('bingoFirstPick');
}
function setFirstPicker(team){
  state.bingo.firstPicker = team;
  state.bingo.turn = team;
  initFillScreen();
  go('bingoFill');
}
function initFillScreen(){
  state.bingo.cells = new Array(9).fill(null);
  state.bingo.cells[CENTER_INDEX] = 'CENTER';
  state.bingo.selectedTile = null;
  renderTilePool();
  renderFillGrid();
  updateFillTurnBanner();
  checkFillDone();
}
function updateFillTurnBanner(){
  const name = state.bingo.turn==='A' ? state.bingo.nameA : state.bingo.nameB;
  document.getElementById('fillTurnBanner').textContent = '現在輪到 '+name+' 選代稱';
}
function renderTilePool(){
  const el = document.getElementById('tilePool');
  el.innerHTML='';
  GAMES.forEach(g=>{
    const used = state.bingo.cells.includes(g.id);
    const t=document.createElement('div');
    t.className='tile'+(used?' used':'')+(state.bingo.selectedTile===g.id?' selected':'');
    t.textContent = g.pun;
    t.onclick=()=>{
      if(used) return;
      state.bingo.selectedTile = g.id;
      renderTilePool();
    };
    el.appendChild(t);
  });
}
function renderFillGrid(){
  const el = document.getElementById('fillGrid');
  el.innerHTML='';
  for(let i=0;i<9;i++){
    const gid = state.bingo.cells[i];
    const c=document.createElement('div');
    if(i===CENTER_INDEX){
      c.className='fill-cell center';
      c.textContent = '共用格\n兩隊都算';
      el.appendChild(c);
      continue;
    }
    c.className='fill-cell'+(gid?' filled':'');
    if(gid){
      const g = GAMES.find(x=>x.id===gid);
      c.textContent = g.pun;
    } else {
      c.textContent = '空格';
      c.onclick=()=>placeTile(i);
    }
    el.appendChild(c);
  }
}
function placeTile(i){
  if(!state.bingo.selectedTile) return;
  state.bingo.cells[i] = state.bingo.selectedTile;
  state.bingo.selectedTile = null;
  state.bingo.turn = state.bingo.turn==='A' ? 'B' : 'A';
  renderTilePool();
  renderFillGrid();
  updateFillTurnBanner();
  checkFillDone();
}
function checkFillDone(){
  const filledCount = state.bingo.cells.filter(x=>x).length; // includes center
  document.getElementById('fillDoneBtn').disabled = filledCount < 9;
}
function randomizeFill(){
  const shuffled = [...GAMES].sort(()=>Math.random()-.5).slice(0,8);
  const cells = new Array(9).fill(null);
  cells[CENTER_INDEX] = 'CENTER';
  let gi=0;
  for(let i=0;i<9;i++){
    if(i===CENTER_INDEX) continue;
    cells[i] = shuffled[gi++].id;
  }
  state.bingo.cells = cells;
  renderFillGrid();
  renderTilePool();
  checkFillDone();
}
function enterBoard(){
  setBaseColor('bingo');
  prepareBoard();
  go('board');
}

/* ================= BINGO: board ================= */
let cellOwners = new Array(9).fill(null); // 'A' | 'B' | 'FREE' | null
let boardTurn = 'A';
function prepareBoard(){
  cellOwners = new Array(9).fill(null);
  cellOwners[CENTER_INDEX] = 'FREE';
  document.getElementById('boardNameA').textContent = state.bingo.nameA;
  document.getElementById('boardNameB').textContent = state.bingo.nameB;
  document.getElementById('boardDotA').style.background = state.bingo.colorA;
  document.getElementById('boardDotB').style.background = state.bingo.colorB;
  document.getElementById('boardDotA').textContent = state.bingo.nameA.charAt(0);
  document.getElementById('boardDotB').textContent = state.bingo.nameB.charAt(0);
  boardTurn = state.bingo.firstPicker;
  renderBoard();
}
function renderBoard(){
  const el = document.getElementById('bingoGrid');
  el.innerHTML='';
  for(let i=0;i<9;i++){
    const owner = cellOwners[i];
    const c=document.createElement('div');
    if(i===CENTER_INDEX){
      c.className='b-cell center';
      c.textContent='共用格';
      el.appendChild(c);
      continue;
    }
    const gid = state.bingo.cells[i];
    const g = GAMES.find(x=>x.id===gid);
    c.className='b-cell'+(owner==='A'?' claim-a':owner==='B'?' claim-b':'');
    if(owner==='A') c.style.background = state.bingo.colorA;
    if(owner==='B') c.style.background = state.bingo.colorB;
    c.textContent = g.pun;
    if(owner){
      const b=document.createElement('div');
      b.className='badge';
      b.textContent = owner==='A'?state.bingo.nameA.charAt(0):state.bingo.nameB.charAt(0);
      c.appendChild(b);
      c.onclick=()=>openCorrection(i);
    } else {
      c.onclick=()=>enterCell(i);
    }
    el.appendChild(c);
  }
  document.getElementById('boardScoreA').textContent = countLines('A')+' 線';
  document.getElementById('boardScoreB').textContent = countLines('B')+' 線';
  const turnName = boardTurn==='A'?state.bingo.nameA:state.bingo.nameB;
  document.getElementById('boardTurnPill').textContent = turnName+'選格';
}

function enterCell(i){
  activeCellIndex = i;
  const gid = state.bingo.cells[i];
  currentGame = GAMES.find(x=>x.id===gid);
  setGameColor(currentGame);
  playScore = {A:0,B:0};
  nextPlayQuestion();
  go('play');
}
function allQuestionsForGame(g){
  return g.packs.flatMap(p=>p.qs);
}
function drawFromQueue(key, allQs){
  const storeKey = 'queue_'+key;
  let queue = JSON.parse(localStorage.getItem(storeKey) || 'null');
  if(!queue || queue.length===0){
    queue = allQs.map((_,idx)=>idx).sort(()=>Math.random()-.5);
  }
  const idx = queue.shift();
  localStorage.setItem(storeKey, JSON.stringify(queue));
  return allQs[idx];
}
function nextPlayQuestion(){
  const allQs = allQuestionsForGame(currentGame);
  const q = drawFromQueue('bingo_'+currentGame.id, allQs);
  document.getElementById('qcard').textContent = q;
  document.getElementById('playScorebar').innerHTML =
    `<span>${state.bingo.nameA} ${playScore.A}</span> <span>：</span> <span>${playScore.B} ${state.bingo.nameB}</span>`;
  const actions = document.getElementById('playActions');
  actions.innerHTML='';
  const revealBtn = document.createElement('button');
  revealBtn.className='btn btn-outline';
  revealBtn.textContent='公布答案／關主判定';
  revealBtn.onclick=()=>showJudgeButtons();
  actions.appendChild(revealBtn);
}
function showJudgeButtons(){
  const actions = document.getElementById('playActions');
  actions.innerHTML='';
  const bA=document.createElement('button');
  bA.className='btn btn-solid';
  bA.textContent=state.bingo.nameA+' 答對';
  bA.onclick=()=>judgeQuestion('A');
  const bB=document.createElement('button');
  bB.className='btn btn-solid';
  bB.textContent=state.bingo.nameB+' 答對';
  bB.onclick=()=>judgeQuestion('B');
  const bN=document.createElement('button');
  bN.className='btn btn-outline';
  bN.textContent='都沒答對，下一題';
  bN.onclick=()=>judgeQuestion(null);
  actions.appendChild(bA); actions.appendChild(bB); actions.appendChild(bN);
}
function judgeQuestion(winner){
  if(winner) playScore[winner]++;
  if(playScore.A>=2 || playScore.B>=2){
    const winTeam = playScore.A>=2 ? 'A' : 'B';
    finishCell(winTeam);
  } else {
    nextPlayQuestion();
  }
}
function finishCell(team){
  cellOwners[activeCellIndex] = team;
  const name = team==='A'?state.bingo.nameA:state.bingo.nameB;
  document.getElementById('cellResultText').textContent = name+' 拿下這格！';
  go('cellResult');
}
function confirmAbandonPlay(){
  if(confirm('確定要離開這一格嗎？目前進度不會保留')){
    setBaseColor('bingo');
    go('board');
  }
}
function returnToBoard(){
  setBaseColor('bingo');
  renderBoard();
  const winner = checkWin();
  if(winner){
    const name = winner==='A'?state.bingo.nameA:state.bingo.nameB;
    document.getElementById('winnerName').textContent = name;
    go('winScreen');
    return;
  }
  boardTurn = boardTurn==='A'?'B':'A';
  renderBoard();
  go('board');
}
function countLines(team){
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  let count=0;
  for(const line of lines){
    const owns = line.every(i=> cellOwners[i]===team || cellOwners[i]==='FREE');
    if(owns) count++;
  }
  return count;
}
function checkWin(){
  if(countLines('A')>=2) return 'A';
  if(countLines('B')>=2) return 'B';
  return null;
}

/* ================= correction modal ================= */
function openCorrection(i){
  correctionIndex = i;
  const owner = cellOwners[i];
  document.getElementById('correctionCurrent').textContent = owner==='A'?state.bingo.nameA:state.bingo.nameB;
  document.getElementById('correctionModal').classList.add('active');
}
function closeModal(){
  document.getElementById('correctionModal').classList.remove('active');
}
function reassignCell(team){
  cellOwners[correctionIndex] = team;
  closeModal();
  renderBoard();
  const winner = checkWin();
  if(winner){
    const name = winner==='A'?state.bingo.nameA:state.bingo.nameB;
    document.getElementById('winnerName').textContent = name;
    go('winScreen');
  }
}
function clearCell(){
  cellOwners[correctionIndex] = null;
  closeModal();
  renderBoard();
}

/* ================= SOLO MODE ================= */
function renderSoloGameList(){
  const el = document.getElementById('soloGameList');
  el.innerHTML='';
  GAMES.forEach(g=>{
    const row=document.createElement('div');
    row.style.cssText='padding:12px 8px;border-bottom:1px solid #eee;cursor:pointer;font-weight:700;display:flex;justify-content:space-between;align-items:center;';
    row.innerHTML = `<span>${g.name}</span><span style="font-size:11px;color:#999;">${g.cat}</span>`;
    row.onclick=()=>{ currentGame=g; renderSoloThemeList(); go('soloThemePick'); };
    el.appendChild(row);
  });
}
function renderSoloThemeList(){
  const el = document.getElementById('soloThemeList');
  el.innerHTML='';
  currentGame.packs.forEach((p,idx)=>{
    const pill=document.createElement('div');
    pill.className='pill'+(idx===0?' active':'');
    pill.textContent=p.name;
    pill.onclick=()=>{
      document.querySelectorAll('#soloThemeList .pill').forEach(x=>x.classList.remove('active'));
      pill.classList.add('active');
      currentPack = p;
    };
    el.appendChild(pill);
  });
  currentPack = currentGame.packs[0];
}
function startSoloPlay(){
  setGameColor(currentGame);
  soloQIdx = 0;
  soloScore = {A:0,B:0};
  soloQueue = [];
  for(let i=0;i<5;i++){
    soloQueue.push(drawFromQueue('solo_'+currentGame.id+'_'+currentPack.id, currentPack.qs));
  }
  showSoloQuestion();
  go('soloPlay');
}
function showSoloQuestion(){
  document.getElementById('soloProgress').textContent = `第 ${soloQIdx+1} / 5 題`;
  document.getElementById('soloQcard').textContent = soloQueue[soloQIdx];
  const actions = document.getElementById('soloPlayActions');
  actions.innerHTML='';
  if(soloMode==='team'){
    const revealBtn=document.createElement('button');
    revealBtn.className='btn btn-outline';
    revealBtn.textContent='公布答案／關主判定';
    revealBtn.onclick=()=>{
      actions.innerHTML='';
      const bA=document.createElement('button');
      bA.className='btn btn-solid';
      bA.textContent=(state.solo.nameA||'A隊')+' 答對';
      bA.onclick=()=>{soloScore.A++; advanceSolo();};
      const bB=document.createElement('button');
      bB.className='btn btn-solid';
      bB.textContent=(state.solo.nameB||'B隊')+' 答對';
      bB.onclick=()=>{soloScore.B++; advanceSolo();};
      const bN=document.createElement('button');
      bN.className='btn btn-outline';
      bN.textContent='都沒答對';
      bN.onclick=()=>advanceSolo();
      actions.appendChild(bA); actions.appendChild(bB); actions.appendChild(bN);
    };
    actions.appendChild(revealBtn);
  } else {
    const nextBtn=document.createElement('button');
    nextBtn.className='btn btn-solid';
    nextBtn.textContent='下一題';
    nextBtn.onclick=()=>advanceSolo();
    actions.appendChild(nextBtn);
  }
}
function advanceSolo(){
  soloQIdx++;
  if(soloQIdx>=5){
    setBaseColor('solo');
    if(soloMode==='team'){
      const nameA = state.solo.nameA||'A隊', nameB = state.solo.nameB||'B隊';
      document.getElementById('soloEndTitle').textContent =
        soloScore.A===soloScore.B ? '平手！' : (soloScore.A>soloScore.B?nameA+' 獲勝！':nameB+' 獲勝！');
      document.getElementById('soloEndSub').textContent = `${nameA} ${soloScore.A} ： ${soloScore.B} ${nameB}`;
    } else {
      document.getElementById('soloEndTitle').textContent = '本輪結束！';
      document.getElementById('soloEndSub').textContent = '辛苦了，休息一下吧';
    }
    go('soloEnd');
    return;
  }
  showSoloQuestion();
}
function confirmAbandonSolo(){
  if(confirm('確定要離開嗎？目前進度不會保留')){
    setBaseColor('solo');
    go('soloThemePick');
  }
}
function confirmSoloTeamSetup(){
  state.solo.nameA = document.getElementById('soloNameA').value.trim() || 'A隊';
  state.solo.nameB = document.getElementById('soloNameB').value.trim() || 'B隊';
  go('soloGamePick');
}

/* ================= HOME CAROUSEL ================= */
const HOME_COLORS = {bingo:'#E7DCC3', solo:'#96774B'};
const CAROUSEL = [
  {id:'bingo', title:'賓果模式', desc:'兩隊搶格對戰，湊滿兩條線獲勝', color:MODE_COLORS.bingo, enter:()=>{setBaseColor('bingo');go('bingoTeamSetup');}},
  {id:'solo',  title:'單機模式', desc:'單獨玩任一款小遊戲，團隊賽或個人賽', color:MODE_COLORS.solo, enter:()=>{setBaseColor('solo');go('soloModeSelect');}},
];
let carouselIndex = 0;
function initCarouselPeeks(){
  const bingoSrc = document.querySelector('#slide-bingo img').src;
  const soloSrc = document.querySelector('#slide-solo img').src;
  // peek-bingo sits on the solo slide (shows the bingo pair); peek-solo sits on the bingo slide
  document.querySelector('#peek-bingo img').src = bingoSrc;
  document.querySelector('#peek-solo img').src = soloSrc;
}
function renderCarousel(){
  CAROUSEL.forEach((c,i)=>{
    document.getElementById('slide-'+c.id).classList.toggle('active', i===carouselIndex);
    document.getElementById('dot-'+i).classList.toggle('active', i===carouselIndex);
  });
  const cur = CAROUSEL[carouselIndex];
  document.getElementById('slideTitle').textContent = cur.title;
  document.getElementById('slideDesc').textContent = cur.desc;
  document.body.style.backgroundColor = HOME_COLORS[cur.id];
  // on the bingo slide, peek the solo cat top-left; on the solo slide, peek the bingo pair top-right
  document.getElementById('peek-solo').classList.toggle('show', cur.id==='bingo');
  document.getElementById('peek-bingo').classList.toggle('show', cur.id==='solo');
}
initCarouselPeeks();
function carouselNav(dir){
  carouselIndex = (carouselIndex + dir + CAROUSEL.length) % CAROUSEL.length;
  renderCarousel();
}
function enterSelectedMode(){
  CAROUSEL[carouselIndex].enter();
}
renderCarousel();

renderSoloGameList();
