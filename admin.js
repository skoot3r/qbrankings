(function(){
const key='qb_rankings_current',hist='qb_rankings_history';
let d=JSON.parse(localStorage.getItem(key)||JSON.stringify(QB_SEED)),selected=0;
async function init(){
 if(window.qbAuthRequired){const session=await qbAuthRequired();if(!session)return;}
 document.getElementById('week').value=d.week;document.getElementById('date').value=d.date;render();
}
function render(){const el=document.getElementById('editorRows');el.innerHTML=d.players.map((p,i)=>`<div class="editor-row ${i===selected?'selected':''}" draggable="true" data-i="${i}"><span class="drag">☷</span><b>${i+1}</b><span>${p.name} <small>${p.team}</small></span><span><button class="move" data-dir="up">↑</button> <button class="move" data-dir="down">↓</button></span></div>`).join('');document.getElementById('thoughts').value=d.players[selected]?.note||'';el.querySelectorAll('.editor-row').forEach(row=>{row.onclick=e=>{if(e.target.classList.contains('move'))return;selected=+row.dataset.i;render()};row.ondragstart=e=>e.dataTransfer.setData('text/plain',row.dataset.i);row.ondragover=e=>e.preventDefault();row.ondrop=e=>{e.preventDefault();let from=+e.dataTransfer.getData('text/plain'),to=+row.dataset.i;let [x]=d.players.splice(from,1);d.players.splice(to,0,x);selected=to;render()}});el.querySelectorAll('.move').forEach(btn=>btn.onclick=e=>{e.stopPropagation();let i=+btn.closest('.editor-row').dataset.i,j=btn.dataset.dir==='up'?i-1:i+1;if(j<0||j>=d.players.length)return;[d.players[i],d.players[j]]=[d.players[j],d.players[i]];selected=j;render()})}
document.getElementById('saveThought').onclick=()=>{d.players[selected].note=document.getElementById('thoughts').value;render();alert('Note saved.')};
document.getElementById('publish').onclick=async()=>{d.week=+document.getElementById('week').value;d.date=document.getElementById('date').value||new Date().toISOString().slice(0,10);const payload={week:d.week,publish_date:d.date,players:d.players};if(window.QB_DB){const {error}=await QB_DB.from('qb_editions').insert(payload);if(error){alert(error.message);return}}else{let h=JSON.parse(localStorage.getItem(hist)||'[]');h.push(JSON.parse(localStorage.getItem(key)||JSON.stringify(d)));localStorage.setItem(hist,JSON.stringify(h));localStorage.setItem(key,JSON.stringify(d));}alert('Published Week '+d.week+'!');location.href='index.html'};
document.getElementById('logout').onclick=()=>qbLogout();init();
})();
