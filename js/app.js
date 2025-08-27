import { renderPlan } from './ui.js';
import { loadAll, saveState } from './storage.js';
const $=id=>document.getElementById(id); const on=(id,ev,fn)=>{const el=$(id); if(el) el.addEventListener(ev,fn);};
let routines={}, state, progress, oneRM, theme; let viewMode=(window.innerWidth<760)?'cards':'cards';

async function boot(){ [routines]= await Promise.all([fetch('data/routines.json?v=1756278459').then(r=>r.json())]); const loaded=loadAll({person:'fercho',day:'Lunes',week:1,notes:''});
state=loaded.state; progress=loaded.progress; oneRM=loaded.oneRM; theme=loaded.theme;
if ($('person')) $('person').value=state.person; if ($('week')) $('week').value=String(state.week);
if ($('day')) $('day').innerHTML=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'].map(dd=> '<option '+(dd===state.day?'selected':'')+' value="'+dd+'">'+dd+'</option>').join('');
on('person','change',e=>{ state.person=e.target.value; saveState(state); renderAll(); });
on('day','change',e=>{ state.day=e.target.value; saveState(state); renderAll(); });
on('week','change',e=>{ state.week=Number(e.target.value); saveState(state); renderAll(); });
const btnView=$('btnView'); if(btnView) btnView.textContent=(viewMode==='table')?'Ver tarjetas':'Ver tabla';
on('btnView','click',()=>{ viewMode=(viewMode==='table')?'cards':'table'; const b=$('btnView'); if(b) b.textContent=(viewMode==='table')?'Ver tarjetas':'Ver tabla'; renderPlan(viewMode,routines,state,oneRM,progress); });
renderAll(); }
function renderAll(){ renderPlan(viewMode,routines,state,oneRM,progress); }
boot();
