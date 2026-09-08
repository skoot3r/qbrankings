(function(){
  const currentKey='qb_rankings_current';
  let d=JSON.parse(localStorage.getItem(currentKey)||JSON.stringify(QB_SEED)),selected=0,dragFrom=null;
  const makeId=()=>('qb-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8));
  const clean=()=>{d.players=(d.players||[]).map((p,i)=>{const stats=p.stats||{};return {...p,id:p.id||('qb-'+String((p.team||'qb')+'-'+(p.name||'qb')).toLowerCase().replace(/[^a-z0-9]+/g,'-')),name:p.name||'Unnamed QB',team:p.team||'',note:p.note||'',headshot:p.headshot||'',stats:{passYards:Number.isFinite(Number(stats.passYards))?Number(stats.passYards):0,td:Number.isFinite(Number(stats.td))?Number(stats.td):0,int:Number.isFinite(Number(stats.int))?Number(stats.int):0,compPct:Number.isFinite(Number(stats.compPct))?Number(stats.compPct):0}}});if(selected>=d.players.length)selected=Math.max(0,d.players.length-1)};

  async function init(){
    const session=await qbAuthRequired();if(!session)return;
    const logout=document.getElementById('logout');if(logout)logout.onclick=window.qbLogout;
    if(window.QB_DB){const {data,error}=await window.QB_DB.from('qb_editions').select('*').order('created_at',{ascending:false}).limit(1).maybeSingle();if(!error&&data)d={week:data.week,date:data.publish_date,players:data.players};}
    clean();
    document.getElementById('week').value=d.week||1;document.getElementById('date').value=d.date||new Date().toISOString().slice(0,10);
    render();
    if(window.resolveQBHeadshots){d.players=await window.resolveQBHeadshots(d.players);render();}
  }

  function render(){
    clean();
    const el=document.getElementById('editorRows');
    if(!d.players.length){el.innerHTML='<div class="empty-editor">No quarterbacks are on the board. Add one below.</div>';document.getElementById('thoughts').value='';return;}
    el.innerHTML=d.players.map((p,i)=>`<div class="editor-row ${i===selected?'selected':''}" draggable="true" data-i="${i}">
      <span class="drag" title="Drag to reorder">☷</span><b>${i+1}</b>
      <div class="editor-player-fields"><input class="player-name-input" value="${esc(p.name)}" aria-label="QB name"><input class="player-team-input" value="${esc(p.team)}" aria-label="Team abbreviation" maxlength="4"></div>
      <div class="editor-actions"><button class="move" data-dir="up" type="button" title="Move up">↑</button><button class="move" data-dir="down" type="button" title="Move down">↓</button><button class="remove-qb" type="button" title="Remove QB">×</button></div>
    </div>`).join('');
    document.getElementById('thoughts').value=d.players[selected]?.note||'';
    el.querySelectorAll('.editor-row').forEach(row=>{
      row.onclick=e=>{if(e.target.closest('button')||e.target.closest('input'))return;selected=+row.dataset.i;render()};
      row.ondragstart=e=>{dragFrom=+row.dataset.i;e.dataTransfer.setData('text/plain',dragFrom)};
      row.ondragover=e=>e.preventDefault();
      row.ondrop=e=>{e.preventDefault();const from=dragFrom??+e.dataTransfer.getData('text/plain'),to=+row.dataset.i;if(from===to)return;const [x]=d.players.splice(from,1);d.players.splice(to,0,x);selected=to;render()};
    });
    el.querySelectorAll('.player-name-input,.player-team-input').forEach(input=>input.oninput=e=>{const row=e.target.closest('.editor-row'),i=+row.dataset.i;if(e.target.classList.contains('player-name-input'))d.players[i].name=e.target.value;else d.players[i].team=e.target.value.toUpperCase()});
    el.querySelectorAll('.editor-row').forEach(row=>row.querySelector('.player-name-input').onfocus=()=>{selected=+row.dataset.i});
    el.querySelectorAll('.move').forEach(btn=>btn.onclick=e=>{e.stopPropagation();const i=+btn.closest('.editor-row').dataset.i,j=btn.dataset.dir==='up'?i-1:i+1;if(j<0||j>=d.players.length)return;[d.players[i],d.players[j]]=[d.players[j],d.players[i]];selected=j;render()});
    el.querySelectorAll('.remove-qb').forEach(btn=>btn.onclick=e=>{e.stopPropagation();const i=+btn.closest('.editor-row').dataset.i;if(!confirm('Remove '+(d.players[i]?.name||'this QB')+' from the current board?'))return;d.players.splice(i,1);selected=Math.min(selected,d.players.length-1);render()});
  }

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  document.getElementById('addQB').onclick=()=>{if(d.players.length>=32){alert('The board is limited to 32 quarterbacks. Remove a QB before adding another.');return}d.players.push({id:makeId(),name:'New QB',team:'',note:'',headshot:'',stats:{passYards:0,td:0,int:0,compPct:0}});selected=d.players.length-1;render();const last=document.querySelector('#editorRows .editor-row:last-child .player-name-input');if(last){last.focus();last.select()}};
  document.getElementById('reset').onclick=()=>{if(!confirm('Reset the editor to the original Top 32 seed? This does not delete anything from Supabase.'))return;d=JSON.parse(JSON.stringify(QB_SEED));selected=0;render()};
  document.getElementById('saveThought').onclick=()=>{if(!d.players[selected])return;d.players[selected].note=document.getElementById('thoughts').value;render()};
  document.getElementById('saveMeta').onclick=()=>{if(!d.players[selected])return;d.players[selected].name=document.getElementById('metaName').value.trim()||'Unnamed QB';d.players[selected].team=document.getElementById('metaTeam').value.trim().toUpperCase();d.players[selected].headshot=document.getElementById('metaHeadshot').value.trim();render();alert('QB details saved.')};
  document.getElementById('editorRows').addEventListener('click',()=>{});
  const originalRender=render;
  function syncMeta(){const p=d.players[selected],stats=p?.stats||{};document.getElementById('metaName').value=p?.name||'';document.getElementById('metaTeam').value=p?.team||'';document.getElementById('metaHeadshot').value=p?.headshot||'';document.getElementById('statPassYards').value=stats.passYards??0;document.getElementById('statTD').value=stats.td??0;document.getElementById('statINT').value=stats.int??0;document.getElementById('statCompPct').value=stats.compPct??0}
  const observer=new MutationObserver(syncMeta);observer.observe(document.getElementById('editorRows'),{childList:true});
  document.getElementById('publish').onclick=async()=>{
    const session=await window.QB_DB?.auth.getSession();if(!session?.data?.session){window.location.replace('login.html');return}
    d.week=+document.getElementById('week').value;d.date=document.getElementById('date').value||new Date().toISOString().slice(0,10);clean();
    if(!d.players.length){alert('Add at least one quarterback before publishing.');return}
    const payload={week:d.week,publish_date:d.date,players:d.players};
    if(!window.QB_DB){alert('Supabase is not connected.');return}
    const {error}=await window.QB_DB.from('qb_editions').insert(payload);if(error){alert(error.message);return}
    localStorage.setItem(currentKey,JSON.stringify(d));alert('Published Week '+d.week+'!');location.href='index.html';
  };
  document.getElementById('editorRows').addEventListener('click',()=>setTimeout(syncMeta,0));
  document.getElementById('thoughts').addEventListener('focus',syncMeta);
  init().then(syncMeta);
})();
