import { applyTheme, DAYS, renderCardio, renderPlan } from './ui.js';
import { loadAll, saveState, saveOneRM, saveTheme, backup } from './storage.js';
const $=id=>document.getElementById(id);
const bind=(id,fn)=>{const el=$(id); if(el) el.onclick=fn;};
let routines={}, defaults1RM={}, state, progress, oneRM, theme;
let viewMode=(window.innerWidth<=900)?'cards':'table';
async function boot(){
  try{
    [routines, defaults1RM] = await Promise.all([
      fetch('data/routines.json?v=1756235335').then(r=>r.json()),
      fetch('data/defaults_1rm.json?v=1756235335').then(r=>r.json())
    ]);
  } finally {
    // show app root (even si tarda algún fetch, ya verás el splash hasta aquí)
    document.getElementById('appRoot').style.opacity = 1;
    document.getElementById('splash').style.display = 'none';
  }
  const loaded=loadAll({person:'fercho',day:'Lunes',week:1,notes:''});
  state=loaded.state; progress=loaded.progress; oneRM=loaded.oneRM||defaults1RM; theme=loaded.theme;
  applyTheme(theme); $('theme').value=theme; $('person').value=state.person; $('week').value=String(state.week);
  $('day').innerHTML = DAYS.map(dd=> '<option '+(dd===state.day?'selected':'')+' value="'+dd+'">'+dd+'</option>').join('');
  $('theme').onchange=e=>{ theme=e.target.value; applyTheme(theme); saveTheme(theme); };
  $('person').onchange=e=>{ state.person=e.target.value; saveState(state); renderAll(); };
  $('day').onchange=e=>{ state.day=e.target.value; saveState(state); renderPlan(viewMode,routines,state,oneRM,progress); };
  $('week').onchange=e=>{ state.week=Number(e.target.value); saveState(state); renderPlan(viewMode,routines,state,oneRM,progress); };
  bind('btnExport', exportCSV); bind('btnSettings', openSettings); bind('btnClose', closeSettings);
  bind('btnAdd1RM', addOneRM); bind('btnReset1RM', resetOneRM);
  bind('btnBackup', ()=>backup({version:'4.5.1',state,progress,oneRM,theme}));
  bind('btnRestore', ()=> $('fileRestore') && $('fileRestore').click());
  $('fileRestore').addEventListener('change',doRestore);
  $('btnView').onclick=toggleView;

  const btnInstall = $('btnInstall'); let deferredInstallPrompt = null;
  if (btnInstall) {
    btnInstall.style.display = 'none';
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstallPrompt = e; btnInstall.style.display = 'inline-block'; });
    window.addEventListener('appinstalled', () => { btnInstall.style.display = 'none'; deferredInstallPrompt = null; });
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) btnInstall.style.display = 'none';
    if (btnInstall) btnInstall.onclick = async () => { try { if (deferredInstallPrompt) { deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt = null; btnInstall.style.display = 'none'; } else { alert('Para instalar: menú → “Instalar app”.'); } } catch { } };
  }

  renderAll();
  if ('serviceWorker' in navigator) { try { await navigator.serviceWorker.register('./sw.js'); } catch(e) { } }
}
function renderAll(){ renderPlan(viewMode,routines,state,oneRM,progress); renderCardio();
  $('deficitText').textContent = state.person==='fercho' ? '−300 a −400 kcal en Mar/Jue/Sáb/Dom; mantenimiento Lun/Mié/Vie'
                                                         : '−200 a −300 kcal en Mar/Jue/Sáb/Dom; mantenimiento Lun/Mié/Vie';
  $('notes').value=state.notes||''; $('notes').oninput=e=>{ state.notes=e.target.value; saveState(state); };
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
  rows.push([]);
  rows.push(['Resumen (máx kg por semana)']);
  rows.push(['Ejercicio/Sub','W1','W2','W3','W4','W5','W6','W7','W8']);
  for (let [name,type,scheme] of plan){
    const subnames = name.split(' + ').map(s=>s.trim());
    subnames.forEach((sub,si)=>{
      const vals=[]; for (let w=1; w<=8; w++){ const k='W'+w; const node=(((progress||{})[state.person]||{})[state.day]||{}); const weekObj=(node[name]||{})[k];
        let m=null; if(weekObj && weekObj.sub && weekObj.sub[si]){ for (let set of weekObj.sub[si]){ const v=parseFloat(set.kg); if(isFinite(v)) m=(m===null)?v:Math.max(m,v); } }
        vals.push(m===null?'':String(m)); }
      rows.push([`${name} / ${sub}`, ...vals]);
    });
  }
  const csv=rows.map(r=>r.map(x=>`"{String(x).replaceAll('"','""')}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=`rutina_${state.person}_${state.day}.csv`; a.click(); URL.revokeObjectURL(url);
}
function openSettings(){ renderOneRMEditor(); $('modal').classList.add('open'); }
function closeSettings(){ $('modal').classList.remove('open'); }
function renderOneRMEditor(){ const root=$('oneRmEditor'); root.innerHTML='';
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
  fetch('data/defaults_1rm.json?v=1756235335').then(r=>r.json()).then(def=>{ oneRM=def; saveOneRM(oneRM); renderOneRMEditor(); renderPlan(viewMode,routines,state,oneRM,progress); });
} }
function doRestore(evt){ const file=evt.target.files[0]; if(!file) return;
  const reader=new FileReader(); reader.onload=()=>{ try{ const data=JSON.parse(reader.result);
    state=data.state||state; progress=data.progress||progress; oneRM=data.oneRM||oneRM; theme=data.theme||theme;
    applyTheme(theme); saveTheme(theme); $('theme').value=theme; saveState(state); saveOneRM(oneRM);
    renderAll(); closeSettings(); alert('Respaldo restaurado.'); }catch{ alert('Archivo inválido.'); } }; reader.readAsText(file);
}
function toggleView(){ viewMode=(viewMode==='table')?'cards':'table'; $('btnView').textContent='Vista: '+(viewMode==='table'?'Tabla':'Tarjetas'); renderPlan(viewMode,routines,state,oneRM,progress); }
boot();
