(function(){
const key='qb_rankings_current',hist='qb_rankings_history',headshotCacheKey='qb_headshots_v1';
const aliases={
  Allen:'Josh Allen',Mahomes:'Patrick Mahomes',Jackson:'Lamar Jackson',Stafford:'Matthew Stafford',Burrow:'Joe Burrow',Prescott:'Dak Prescott',Goff:'Jared Goff',Herbert:'Justin Herbert',Love:'Jordan Love',Williams:'Caleb Williams',Maye:'Drake Maye',Lawrence:'Trevor Lawrence',Daniels:'Jayden Daniels',Hurts:'Jalen Hurts',Nix:'Bo Nix',Mayfield:'Baker Mayfield',Darnold:'Sam Darnold',Purdy:'Brock Purdy',Stroud:'C.J. Stroud',Shough:'Tyler Shough',Murray:'Kyler Murray',Young:'Bryce Young',Jones:'Daniel Jones',Brissett:'Jacoby Brissett',Rodgers:'Aaron Rodgers',Cousins:'Kirk Cousins',Ward:'Cam Ward',Dart:'Jaxson Dart',Smith:'Geno Smith',Willis:'Malik Willis',Tua:'Tua Tagovailoa',Watson:'Deshaun Watson'
};
function slug(s){return String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'qb';}
function normalizePlayers(players){
  return (players||[]).map((p,i)=>{
    const stats=p.stats||{};
    return {...p,id:p.id||slug((p.team||'qb')+'-'+p.name+'-'+i),name:p.name||'Unnamed QB',team:p.team||'',note:p.note||'',headshot:p.headshot||'',statsMode:p.statsMode||'auto',stats:{
      passYards:Number.isFinite(Number(stats.passYards))?Number(stats.passYards):0,
      td:Number.isFinite(Number(stats.td))?Number(stats.td):0,
      int:Number.isFinite(Number(stats.int))?Number(stats.int):0,
      compPct:Number.isFinite(Number(stats.compPct))?Number(stats.compPct):0
    }};
  });
}
function normalizeEdition(d){return {...d,players:normalizePlayers(d.players)};}

const LIVE_STATS_URL='https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_2026.csv';
let liveStatsCache=null, liveStatsPromise=null, liveStatsFetchedAt=0;
function statNum(v){const n=Number(v);return Number.isFinite(n)?n:0;}
async function loadLiveStats(){
  if(liveStatsCache && Date.now()-liveStatsFetchedAt<10*60*1000)return liveStatsCache;
  if(liveStatsPromise)return liveStatsPromise;
  liveStatsPromise=(async()=>{
    try{
      const res=await fetch(LIVE_STATS_URL,{cache:'no-store'});
      if(!res.ok)throw new Error('live stats request failed: '+res.status);
      const rows=parseCSV(await res.text());if(!rows.length)throw new Error('empty live stats file');
      const h=rows[0].map(x=>x.trim());const ix={};h.forEach((name,i)=>ix[name]=i);
      const needed=['player_display_name','player_id','position','season_type','completions','attempts','passing_yards','passing_tds','passing_interceptions'];
      if(needed.some(k=>ix[k]===undefined))throw new Error('live stats columns missing');
      const out={};
      for(let i=1;i<rows.length;i++){
        const r=rows[i];if((r[ix.position]||'').trim()!=='QB'||(r[ix.season_type]||'').trim()!=='REG')continue;
        const name=(r[ix.player_display_name]||'').trim();if(!name)continue;
        const id=(r[ix.player_id]||'').trim();
        const key=(id||name).toLowerCase();
        if(!out[key])out[key]={name,id,passYards:0,td:0,int:0,completions:0,attempts:0};
        const a=out[key];a.passYards+=statNum(r[ix.passing_yards]);a.td+=statNum(r[ix.passing_tds]);a.int+=statNum(r[ix.passing_interceptions]);a.completions+=statNum(r[ix.completions]);a.attempts+=statNum(r[ix.attempts]);
      }
      const byName={};Object.values(out).forEach(a=>{a.compPct=a.attempts?Math.round(a.completions/a.attempts*1000)/10:0;byName[a.name.toLowerCase()]=a;if(a.id)byName[a.id.toLowerCase()]=a;});
      liveStatsCache=byName;liveStatsFetchedAt=Date.now();return byName;
    }catch(err){console.warn('Could not load live NFL stats:',err);liveStatsCache={};liveStatsFetchedAt=Date.now();return liveStatsCache;}
  })();
  return liveStatsPromise;
}
window.qbLoadLiveStats=loadLiveStats;
function applyLiveStats(players,live){
  return players.map(p=>{
    if(p.statsMode==='manual')return p;
    const canonical=aliases[p.name]||p.name;const a=live[(canonical||'').toLowerCase()]||live[(p.name||'').toLowerCase()];
    if(!a)return p;
    return {...p,stats:{passYards:a.passYards,td:a.td,int:a.int,compPct:a.compPct},statsSource:'live'};
  });
}
window.qbApplyLiveStats=applyLiveStats;
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function localSeed(){
  if(!localStorage.getItem(key)) localStorage.setItem(key,JSON.stringify(normalizeEdition(QB_SEED)));
  return normalizeEdition(JSON.parse(localStorage.getItem(key)));
}
function cachedHeadshots(){try{return JSON.parse(localStorage.getItem(headshotCacheKey)||'{}')}catch{return {}}}
function saveHeadshots(map){try{localStorage.setItem(headshotCacheKey,JSON.stringify(map))}catch{}}
function builtInHeadshots(){return window.QB_HEADSHOTS||{}}
function parseCSV(text){
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(quoted){if(c==='"'&&n==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c}else{if(c==='"')quoted=true;else if(c===','){row.push(cell);cell=''}else if(c==='\n'){row.push(cell);rows.push(row);row=[];cell=''}else if(c!=='\r')cell+=c}}if(cell.length||row.length){row.push(cell);rows.push(row)}return rows;}
async function resolveHeadshots(players){
  const out={...cachedHeadshots(),...builtInHeadshots()};
  const missing=players.filter(p=>!out[aliases[p.name]||p.name] && !out[p.name] && !p.headshot);
  if(!missing.length)return players.map(p=>{const canonical=aliases[p.name]||p.name;return {...p,headshot:out[canonical]||out[p.name]||p.headshot||''};});
  try{
    const res=await fetch('https://github.com/nflverse/nflverse-data/releases/download/players/players.csv',{cache:'force-cache'});
    if(!res.ok)throw new Error('headshot data request failed');
    const rows=parseCSV(await res.text());if(!rows.length)return players;
    const headers=rows[0].map(x=>x.trim());const nameIx=headers.indexOf('display_name'),shotIx=headers.indexOf('headshot_url');
    if(nameIx<0||shotIx<0)return players;
    const wanted=new Set(players.map(p=>(aliases[p.name]||p.name).toLowerCase()));
    for(let i=1;i<rows.length;i++){const name=(rows[i][nameIx]||'').trim(),shot=(rows[i][shotIx]||'').trim();if(name&&shot&&wanted.has(name.toLowerCase()))out[name]=shot;}
    saveHeadshots(out);
    return players.map(p=>{const canonical=aliases[p.name]||p.name;return {...p,headshot:out[canonical]||out[p.name]||p.headshot||''};});
  }catch(err){console.warn('Could not load NFL headshots:',err);return players.map(p=>{const canonical=aliases[p.name]||p.name;return {...p,headshot:out[canonical]||out[p.name]||p.headshot||''};});}
}
window.resolveQBHeadshots=resolveHeadshots;
async function loadLatest(){
  if(window.QB_DB){
    const {data,error}=await window.QB_DB.from('qb_editions').select('*').order('created_at',{ascending:false}).limit(1).maybeSingle();
    if(!error&&data){const d=normalizeEdition({week:data.week,date:data.publish_date,players:data.players});localStorage.setItem(key,JSON.stringify(d));return d;}
    if(error)console.warn('Could not load latest QB edition:',error.message);
  }
  return localSeed();
}
async function loadPrevious(){
  if(window.QB_DB){
    const {data,error}=await window.QB_DB.from('qb_editions').select('*').order('created_at',{ascending:false}).range(1,1).maybeSingle();
    if(!error&&data)return normalizeEdition({week:data.week,date:data.publish_date,players:data.players});
    if(error)console.warn('Could not load previous QB edition:',error.message);
  }
  const h=JSON.parse(localStorage.getItem(hist)||'[]');return h.length?normalizeEdition(h[h.length-1]):null;
}
window.renderHome=async function(){
  const cards=document.getElementById('cards');if(!cards)return;
  let [d,prev]=await Promise.all([loadLatest(),loadPrevious()]);
  const live=await loadLiveStats();
  d.players=applyLiveStats(d.players,live);
  d.players=await resolveHeadshots(d.players);document.getElementById('weekLabel').textContent='Week '+d.week;
  document.getElementById('updated').textContent='Updated '+new Date(d.date+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
  function draw(){
    const q=(document.getElementById('search').value||'').toLowerCase(),f=document.getElementById('filter').value;
    cards.innerHTML=d.players.map((p,i)=>{const old=prev?prev.players.findIndex(x=>(x.id&&p.id&&x.id===p.id)||x.name===p.name):-1;const m=old<0?0:old-i,cls=m>0?'up':m<0?'down':'same',label=m>0?'▲ '+m:m<0?'▼ '+Math.abs(m):'—';return {...p,i,m,cls,label};}).filter(x=>(!q||x.name.toLowerCase().includes(q))&&(f==='all'||(f==='up'&&x.m>0)||(f==='down'&&x.m<0)||(f==='same'&&!x.m))).map(x=>`<article class="card" tabindex="0" role="button" aria-expanded="false"><div class="rank">${x.i+1}</div><div class="movement ${x.cls}" aria-label="Rank change">${x.label}</div><div class="player-identity">${x.headshot?`<img class="qb-headshot" src="${esc(x.headshot)}" alt="" loading="lazy" onerror="this.parentElement.classList.add('headshot-missing');this.remove()">`:''}<div class="player-copy"><div class="name-line"><div class="name">${esc(x.name)}</div><div class="team">${esc(x.team)}</div></div></div></div><div class="qb-stats card-stats"><span><b>${esc(x.stats?.passYards??0)}</b><small>YDS</small></span><span><b>${esc(x.stats?.td??0)}</b><small>TD</small></span><span><b>${esc(x.stats?.int??0)}</b><small>INT</small></span><span><b>${esc(Number(x.stats?.compPct??0).toFixed(1))}%</b><small>CMP</small></span></div><div class="note">${esc(x.note||'')}</div></article>`).join('');
    cards.querySelectorAll('.card').forEach(card=>{
      const toggle=()=>{const open=card.classList.toggle('expanded');card.setAttribute('aria-expanded',String(open));};
      card.addEventListener('click',toggle);
      card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
    });
  }
  document.getElementById('search').oninput=draw;document.getElementById('filter').onchange=draw;draw();
};
window.renderHistory=async function(){
  const el=document.getElementById('history');if(!el)return;let h=[];
  if(window.QB_DB){const {data,error}=await window.QB_DB.from('qb_editions').select('id,week,publish_date,created_at,players').order('created_at',{ascending:false});if(!error)h=data||[];else console.warn('Could not load history:',error.message)}
  if(!h.length)h=JSON.parse(localStorage.getItem(hist)||'[]').slice().reverse();
  const byWeek=new Map();h.forEach(d=>{const week=Number(d.week);if(!byWeek.has(week))byWeek.set(week,normalizeEdition(d))});
  const weeks=[...byWeek.values()].sort((a,b)=>Number(a.week)-Number(b.week));
  if(weeks.length){const allPlayers=weeks.flatMap(w=>w.players||[]);const resolved=await resolveHeadshots(allPlayers);let k=0;weeks.forEach(w=>{w.players=(w.players||[]).map(()=>resolved[k++])})}
  if(!weeks.length){el.innerHTML='<p class="hint">No previous editions yet. Publish your first week from the Editor.</p>';return;}
  el.innerHTML=`<div class="history-tabs" role="tablist" aria-label="Weekly rankings">${weeks.map((d,i)=>`<button class="history-tab ${i===weeks.length-1?'active':''}" type="button" role="tab" aria-selected="${i===weeks.length-1}" data-week="${d.week}">Week ${d.week}</button>`).join('')}</div><div class="history-panel" id="historyPanel"></div>`;
  const panel=document.getElementById('historyPanel');
  function showWeek(week){
    const idx=weeks.findIndex(w=>Number(w.week)===Number(week));const d=weeks[idx];if(!d)return;
    const prev=idx>0?weeks[idx-1]:null;const players=d.players||[];
    const dateValue=d.publish_date||d.date;const date=dateValue?new Date(dateValue+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'';
    const cards=players.map((p,i)=>{const old=prev?prev.players.findIndex(x=>(x.id&&p.id&&x.id===p.id)||x.name===p.name):-1;const m=old<0?0:old-i;const cls=m>0?'up':m<0?'down':'same';const label=m>0?'▲ '+m:m<0?'▼ '+Math.abs(m):'—';return {...p,i,m,cls,label};}).map(x=>`<article class="card" tabindex="0" role="button" aria-expanded="false"><div class="rank">${x.i+1}</div><div class="movement ${x.cls}" aria-label="Rank change">${x.label}</div><div class="player-identity">${x.headshot?`<img class="qb-headshot" src="${esc(x.headshot)}" alt="" loading="lazy" onerror="this.parentElement.classList.add('headshot-missing');this.remove()">`:''}<div class="player-copy"><div class="name-line"><div class="name">${esc(x.name)}</div></div><div class="team">${esc(x.team)}</div></div></div><div class="qb-stats card-stats"><span><b>${esc(x.stats?.passYards??0)}</b><small>YDS</small></span><span><b>${esc(x.stats?.td??0)}</b><small>TD</small></span><span><b>${esc(x.stats?.int??0)}</b><small>INT</small></span><span><b>${esc(Number(x.stats?.compPct??0).toFixed(1))}%</b><small>CMP</small></span></div><div class="note">${esc(x.note||'')}</div></article>`).join('');
    panel.innerHTML=`<div class="history-heading"><div><p class="eyebrow">ARCHIVED BOARD</p><h2>Week ${d.week}</h2></div><span class="history-date">${date?'Published '+date:''}</span></div><div class="board history-board">${cards}</div>`;
    panel.querySelectorAll('.card').forEach(card=>{const toggle=()=>{const open=card.classList.toggle('expanded');card.setAttribute('aria-expanded',String(open));};card.addEventListener('click',toggle);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}})});
    el.querySelectorAll('.history-tab').forEach(tab=>{const active=Number(tab.dataset.week)===Number(week);tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active))});
  }
  el.querySelectorAll('.history-tab').forEach(tab=>tab.onclick=()=>showWeek(tab.dataset.week));showWeek(weeks[weeks.length-1].week);
};
if(document.getElementById('cards')){window.renderHome();setInterval(()=>{liveStatsCache=null;liveStatsPromise=null;window.renderHome();},10*60*1000);}if(document.getElementById('history'))window.renderHistory();
})();
