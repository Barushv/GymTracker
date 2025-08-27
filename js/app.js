import { renderPlan, DAYS, renderCardio } from './ui.js';
import { loadAll, saveState, saveOneRM, saveTheme, backup } from './storage.js';
const $=id=>document.getElementById(id);
const on=(id,ev,fn)=>{const el=$(id); if(el) el.addEventListener(ev,fn);};

let routines={}, defaults1RM={}, state, progress, oneRM, theme;
let viewMode = (window.innerWidth<760)?'cards':'table';

async function boot() {
  try {
    [routines, defaults1RM] = await Promise.all([
      fetch('data/routines.json?v=1756259674').then(r=>r.json()),
      fetch('data/defaults_1rm.json?v=1756259674').then(r=>r.json())
    ]);
  } catch(e) { console.warn('Data load warn', e); }

  const loaded=loadAll({person:'fercho',day:'Lunes',week:1,notes:''});
  state=loaded.state; progress=loaded.progress; oneRM=loaded.oneRM||defaults1RM; theme=loaded.theme;

  if ($('theme')) $('theme').value=theme;
  if ($('person')) $('person').value=state.person;
  if ($('week')) $('week').value=String(state.week);
  if ($('day')) $('day').innerHTML = DAYS.map(dd=> '<option '+(dd===state.day?'selected':'')+' value="'+dd+'">'+dd+'</option>').join('');

  on('theme','change',e=>{ theme=e.target.value; saveTheme(theme); });
  on('person','change',e=>{ state.person=e.target.value; saveState(state); renderAll(); });
  on('day','change',e=>{ state.day=e.target.value; saveState(state); renderAll(); });
  on('week','change',e=>{ state.week=Number(e.target.value); saveState(state); renderAll(); });
  on('btnExport','click',exportCSV);
  on('btnSettings','click',openSettings);
  on('btnClose','click',()=>{ const m=$('modal'); if(m) m.classList.remove('open'); });
  on('btnAdd1RM','click',addOneRM);
  on('btnReset1RM','click',resetOneRM);
  on('btnBackup','click',()=>backup({version:'4.6.0',state,progress,oneRM,theme}));
  on('btnRestore','click',()=>{ const f=$('fileRestore'); if(f) f.click(); });
  const fr=$('fileRestore'); if(fr) fr.addEventListener('change',doRestore);
  const btnView=$('btnView'); if(btnView) btnView.textContent=(viewMode==='table')?'Ver tarjetas':'Ver tabla';
  on('btnView','click',()=>{ viewMode=(viewMode==='table')?'cards':'table'; const b=$('btnView'); if(b) b.textContent=(viewMode==='table')?'Ver tarjetas':'Ver tabla'; renderPlan(viewMode,routines,state,oneRM,progress); });

  renderAll();

  const params=new URLSearchParams(location.search);
  const dev = params.get('dev')==='1';
  if(!dev && 'serviceWorker' in navigator){ try{ await navigator.serviceWorker.register('./sw.js'); }catch(e){ console.warn('SW reg',e); } }
  if(dev) console.log('SW omitido por ?dev=1');
  window.addEventListener('resize',()=>{ /* no-op */ });
}

function renderAll(){ renderPlan(viewMode,routines,state,oneRM,progress); renderCardio();
  const dt=$('deficitText'); if(dt) dt.textContent = state.person==='fercho' ? '−300 a −400 kcal (Mar/Jue/Sáb/Dom)' : '−200 a −300 kcal (Mar/Jue/Sáb/Dom)';
  const notes=$('notes'); if(notes){ notes.value=state.notes||''; notes.oninput=e=>{ state.notes=e.target.value; saveState(state); }; }
}

function exportCSV(){
  const plan=(routines[state.person]||{})[state.day]||[];
  const rows=[]; 
  rows.push(['Persona',state.person]); rows.push(['Día',state.day]); rows.push(['Vista Semana',state.week]); rows.push([]);
  rows.push(['Ejercicio/Sub','Tipo','Esquema','Tempo','Descanso','RIR','Semana','Set','kg','reps']);
  for (let [name,type,scheme,load,tempo,rest,rir] of plan){
    const subnames = name.split(' + ').map(s=>s.trim());
    const counts = (function(){ const re=/(\d+)×/g; const arr=[]; let m; while((m=re.exec(scheme))!==null) arr.push(parseInt(m[1],10)); if(!arr.length) arr.push(3); if(subnames.length===1) return [arr.reduce((a,b)=>a+b,0)]; return subnames.map((_,i)=> arr[i]||arr[0]||3); })();
    subnames.forEach((sub,si)=>{
      for (let w=1; w<=8; w++){ const k='W'+w; const node=(((progress||{})[state.person]||{})[state.day]||{}); const weekObj=(node[name]||{})[k];
        const arr=(weekObj && weekObj.sub && weekObj.sub[si])? weekObj.sub[si] : Array.from({length:counts[si]}).map(()=>({kg:'',reps:''}));
        arr.forEach((pair,idx)=>{ rows.push([`${name} / ${sub}`, type, scheme, tempo||'', rest||'', rir||'', k, `S${idx+1}`, pair.kg||'', pair.reps||'']); });
      }
    });
  }
  const csv=rows.map(r=>r.map(x=>`"{String(x).replaceAll('"','""')}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=`rutina_${state.person}_${state.day}.csv`; a.click(); URL.revokeObjectURL(url);
}

function openSettings(){ const m=$('modal'); if(!m) return; renderOneRMEditor(); m.classList.add('open'); }
function renderOneRMEditor(){ const root=$('oneRmEditor'); if(!root) return; root.innerHTML='';
  ['fercho','andy'].forEach(person=>{ const block=document.createElement('div'); block.innerHTML=`<h4 style="margin:8px 0">${person.toUpperCase()}</h4>`;
    const list=document.createElement('div'); list.className='grid2';
    Object.keys(oneRM[person]).sort().forEach(k=>{ const wrap=document.createElement('div');
      wrap.innerHTML=`<label>${k}</label><input type="number" step="0.5" value="${oneRM[person][k]}" data-person="${person}" data-ex="${k}">`;
      list.appendChild(wrap); }); block.appendChild(list); root.appendChild(block); });
  root.querySelectorAll('input[type=number]').forEach(inp=>{ inp.addEventListener('change',e=>{ const p=e.target.getAttribute('data-person'), ex=e.target.getAttribute('data-ex'), val=parseFloat(e.target.value);
    if(isFinite(val)){ oneRM[p][ex]=val; saveOneRM(oneRM); renderPlan(viewMode,routines,state,oneRM,progress); } }); });
}
function addOneRM(){ const who=prompt('¿Para quién? (fercho/andy)','fercho'); if(!who||!oneRM[who]) return;
  const name=prompt('Nombre exacto del ejercicio (igual a la tabla):','Hip Thrust'); if(!name) return;
  const val=parseFloat(prompt('1RM en kg:','100')); if(!isFinite(val)) return;
  oneRM[who][name]=val; saveOneRM(oneRM); renderOneRMEditor(); renderPlan(viewMode,routines,state,oneRM,progress);
}
function resetOneRM(){ if(confirm('¿Restablecer 1RM a valores por defecto?')){
  fetch('data/defaults_1rm.json?v=1756259674').then(r=>r.json()).then(def=>{ oneRM=def; saveOneRM(oneRM); renderOneRMEditor(); renderPlan(viewMode,routines,state,oneRM,progress); });
} }
function doRestore(evt){ const file=evt.target.files[0]; if(!file) return;
  const reader=new FileReader(); reader.onload=()=>{ try{ const data=JSON.parse(reader.result);
    state=data.state||state; progress=data.progress||progress; oneRM=data.oneRM||oneRM; theme=data.theme||theme;
    saveState(state); saveOneRM(oneRM); renderAll(); alert('Respaldo restaurado.'); }catch{ alert('Archivo inválido.'); } }; reader.readAsText(file);
}
boot();
