(function(){
const key='qb_rankings_current',hist='qb_rankings_history';
function localSeed(){if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(QB_SEED));return JSON.parse(localStorage.getItem(key));}
async function loadLatest(){
  if(window.QB_DB){
    const {data,error}=await QB_DB.from('qb_editions').select('*').order('created_at',{ascending:false}).limit(1).maybeSingle();
    if(!error && data){
      const d={week:data.week,date:data.publish_date,players:data.players};
      localStorage.setItem(key,JSON.stringify(d));
      return d;
    }
  }
  return localSeed();
}
async function loadPrevious(){
  if(window.QB_DB){
    const {data,error}=await QB_DB.from('qb_editions').select('*').order('created_at',{ascending:false}).range(1,1).maybeSingle();
    if(!error && data)return {week:data.week,date:data.publish_date,players:data.players};
  }
  let h=JSON.parse(localStorage.getItem(hist)||'[]');return h.length?h[h.length-1]:null;
}
window.renderHome=async function(){
 let d=await loadLatest(),prev=await loadPrevious(),cards=document.getElementById('cards');if(!cards)return;
 document.getElementById('weekLabel').textContent='Week '+d.week;
 document.getElementById('updated').textContent='Updated '+new Date(d.date+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
 function draw(){let q=(document.getElementById('search').value||'').toLowerCase(),f=document.getElementById('filter').value;
 cards.innerHTML=d.players.map((p,i)=>{let old=prev?prev.players.findIndex(x=>x.name===p.name):-1,m=old<0?0:old-i,cls=m>0?'up':m<0?'down':'same',label=m>0?'▲ '+m:m<0?'▼ '+Math.abs(m):'—';return {...p,i,m,cls,label}}).filter(x=>(!q||x.name.toLowerCase().includes(q))&&(f==='all'||(f==='up'&&x.m>0)||(f==='down'&&x.m<0)||(f==='same'&&!x.m))).map(x=>`<article class="card"><div class="rank">${x.i+1}</div><div><div class="name">${x.name}</div><div class="team">${x.team}</div></div><div class="movement ${x.cls}">${x.label}</div><div class="note">${x.note||''}</div></article>`).join('')}
 document.getElementById('search').oninput=draw;document.getElementById('filter').onchange=draw;draw();
};
window.renderHistory=async function(){let el=document.getElementById('history');if(!el)return;let h=[];
 if(window.QB_DB){const {data}=await QB_DB.from('qb_editions').select('week,publish_date,created_at').order('created_at',{ascending:false});h=data||[];}
 if(!h.length){h=JSON.parse(localStorage.getItem(hist)||'[]').slice().reverse();}
 el.innerHTML=h.length?h.map(d=>`<div class="history-item"><b>Week ${d.week}</b><span>${new Date((d.publish_date||d.date)+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</span></div>`).join(''):'<p class="hint">No previous editions yet. Publish your first week from the Editor.</p>'};
if(document.getElementById('cards'))window.renderHome();if(document.getElementById('history'))window.renderHistory();
})();
