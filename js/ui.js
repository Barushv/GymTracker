import { saveProgress } from './storage.js';
export const THEMES={ emerald:{bg:'#0b0b0c',card:'#141416',text:'#e8eaed',muted:'#9aa0a6',brand:'#22c55e',line:'#25262a',themeColor:'#0B0B0C'},
teal:{bg:'#0b1111',card:'#101617',text:'#e6fffb',muted:'#8bd5ce',brand:'#14b8a6',line:'#173336',themeColor:'#0b1111'},
indigo:{bg:'#0f1020',card:'#16172b',text:'#e4e7ff',muted:'#a5adcb',brand:'#6366f1',line:'#2a2c44',themeColor:'#0f1020'},
rose:{bg:'#140c10',card:'#1c1317',text:'#ffe4e6',muted:'#f5b2be',brand:'#f43f5e',line:'#3a232b',themeColor:'#140c10'},
amber:{bg:'#120f09',card:'#1b160f',text:'#fff7ed',muted:'#f3d7a6',brand:'#f59e0b',line:'#3a2f1e',themeColor:'#120f09'} };
export function applyTheme(name){ const t=THEMES[name]||THEMES.emerald; const r=document.documentElement.style; for(const k of ['bg','card','text','muted','brand','line']) r.setProperty('--'+k,t[k]); document.getElementById('themeColor').setAttribute('content',t.themeColor); }
export const DAYS=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
export const CARDIO=[['Lunes','Elíptica LISS Zona 2','20–25 min','RPE 5–6; 60–70% FCmáx'],['Martes','Caminadora HIIT','8–10× (30–40″ fuerte / 60–90″ suave)','RPE 8–9 tramos duros'],['Miércoles','Elíptica LISS (opc.)','15–20 min','Sólo si no afecta quads'],['Jueves','Caminadora LISS pendiente','25–35 min','6–8% / 4.5–5.5 km/h'],['Viernes','Elíptica LISS','15–20 min','Recuperación'],['Sábado','Escalera o elíptica LISS','20–30 min','RPE 5–6'],['Domingo','LISS 35–45′ + Core 8–12′','—','sin glúteo; dead bug, pallof, plancha']];

export function round05(x){return Math.round(x*2)/2}
export function kgRange(oneRM, person, load){ if(!load||load.auto) return 'Autoajuste'; const rm=oneRM[person]?.[load.key]; if(!rm) return 'Autoajuste'; return load.pct.map(([lo,hi],i)=>{const loKg=round05(rm*lo), hiKg=round05(rm*hi); return (i===0?'':'(top), ')+`${loKg}–${hiKg} kg`;}).join(' '); }
const WKEYS=['W1','W2','W3','W4','W5','W6','W7','W8'];

export function splitSubnames(name){ return name.split(' + ').map(s=>s.trim()); }
export function parseCounts(scheme){ const re=/(\d+)×/g; const out=[]; let m; while((m=re.exec(scheme))!==null) out.push(parseInt(m[1],10)); return out.length?out:[3]; }
export function setsFor(name,scheme){ const subs=splitSubnames(name); const counts=parseCounts(scheme);
  if(subs.length===1){ return [counts.reduce((a,b)=>a+b,0)]; }
  return subs.map((_,i)=> counts[i] || counts[0] || 3);
}

export function ensurePath(progress, person, day, ex){ progress[person]=progress[person]||{}; progress[person][day]=progress[person][day]||{}; progress[person][day][ex]=progress[person][day][ex]||{}; return progress[person][day][ex]; }
export function getWeek(progress, person, day, ex, wk, subIdx, setCount){
  const node=ensurePath(progress,person,day,ex); const key='W'+wk; node[key]=node[key]||{sub:[]};
  while(node[key].sub.length<=subIdx) node[key].sub.push([]);
  const arr=node[key].sub[subIdx];
  while(arr.length<setCount) arr.push({kg:'',reps:''});
  return node[key];
}
export function setCell(progress, person, day, ex, wk, subIdx, setIdx, field, val){
  const node=getWeek(progress,person,day,ex,wk,subIdx,setIdx+1);
  node.sub[subIdx][setIdx][field]=val;
  saveProgress(progress);
}
export function maxKg(weekObj){
  if(!weekObj||!weekObj.sub) return '';
  let m=null;
  weekObj.sub.forEach(sub=> sub.forEach(set=>{ const v=parseFloat(set.kg); if(isFinite(v)){ m=(m===null)?v:Math.max(m,v); }}));
  return (m===null)?'':String(m);
}
export function historyString(progress, person, day, ex){
  const node=ensurePath(progress,person,day,ex);
  return WKEYS.map(k=> maxKg(node[k]) || '').join(' | ');
}

export function renderCardio(){ const root=document.getElementById('cardioList'); root.innerHTML= CARDIO.map(([d,mod,dur,nota])=>`<div class="cardio-row"><div class="day"><b>${d}</b></div><div class="mod">${mod}</div><div class="dur">${dur}</div><div class="note">${nota}</div></div>`).join(''); }

export function renderPlan(viewMode,routines,state,oneRM,progress){
  const plan=(routines[state.person]||{})[state.day]||[]; const wk=state.week;
  const container=document.getElementById('planContainer');

  if(viewMode==='table'){
    container.innerHTML=`<div class="table-wrapper"><table id="planTable">
      <thead><tr><th>Ejercicio</th><th>Tipo</th><th>Esquema</th><th>Carga objetivo</th><th>Tempo</th><th>Descanso</th><th>RIR</th><th class="cell-sets">Series (kg + reps) — W${wk}</th><th class="muted">Historial (máx kg) W1–W8</th></tr></thead>
      <tbody></tbody></table></div>`;
    const tb=container.querySelector('tbody');

    plan.forEach(([name,type,scheme,load,tempo,rest,rir])=>{
      const subnames=splitSubnames(name); const counts=setsFor(name,scheme);
      const tr=document.createElement('tr');
      const hist = historyString(progress,state.person,state.day,name);
      const kgR = kgRange(oneRM,state.person,load);

      const wrap = document.createElement('div'); wrap.className='sets';
      subnames.forEach((sub,si)=>{
        const setCount = counts[Math.min(si,counts.length-1)];
        const weekObj = getWeek(progress,state.person,state.day,name,wk,si,setCount);
        const col = document.createElement('div'); col.className='set';
        let inner = `<label>${sub} • ${setCount}×</label><div class="pair-list">`;
        for(let s=0;s<setCount;s++){
          const kv = weekObj.sub[si][s]?.kg || ''; const rv = weekObj.sub[si][s]?.reps || '';
          inner += `<div class="pair"><input type="number" step="0.5" placeholder="kg" data-ex="${name}" data-sub="${si}" data-set="${s}" data-wk="${wk}" value="${kv}"><input type="number" step="1" placeholder="reps" data-ex="${name}" data-sub="${si}" data-set="${s}" data-wk="${wk}" value="${rv}"></div>`;
        }
        inner += `</div><div class="history">Máx W${wk}: <b>${maxKg(weekObj)||'—'}</b></div>`;
        col.innerHTML = inner;
        wrap.appendChild(col);
      });

      tr.innerHTML = `<td><b>${name}</b></td><td><span class="tag">${type}</span></td><td>${scheme}</td>
                      <td class="kg">${kgR}</td><td>${tempo||'—'}</td><td>${rest||'—'}</td><td>${rir||'—'}</td>
                      <td></td><td class="muted">${hist}</td>`;
      tr.children[7].appendChild(wrap);
      tb.appendChild(tr);
    });

    tb.querySelectorAll('input[type=number]').forEach(inp=>{
      inp.addEventListener('input',ev=>{
        const el=ev.target; const ex=el.dataset.ex; const sub=parseInt(el.dataset.sub,10); const set=parseInt(el.dataset.set,10); const wk=parseInt(el.dataset.wk,10);
        const field = (el.placeholder==='kg')?'kg':'reps';
        setCell(progress,state.person,state.day,ex,wk,sub,set,field,el.value);
        const histCell = el.closest('tr').querySelector('td:last-child');
        histCell.textContent = historyString(progress,state.person,state.day,ex);
        const weekObj = getWeek(progress,state.person,state.day,ex,wk,sub,set+1);
        const maxDiv = el.closest('.set').querySelector('.history b'); if(maxDiv) maxDiv.textContent = maxKg(weekObj) || '—';
      });
    });
  } else {
    const html = plan.map(([name,type,scheme,load,tempo,rest,rir])=>{
      const subnames=splitSubnames(name); const counts=setsFor(name,scheme);
      const kgR = kgRange(oneRM,state.person,load);
      const hist = historyString(progress,state.person,state.day,name);
      let setsHtml='';
      subnames.forEach((sub,si)=>{
        const setCount = counts[Math.min(si,counts.length-1)];
        const weekObj = getWeek(progress,state.person,state.day,name,wk,si,setCount);
        let pairs='';
        for(let s=0;s<setCount;s++){
          const kv = weekObj.sub[si][s]?.kg || ''; const rv = weekObj.sub[si][s]?.reps || '';
          pairs += `<div class="pair"><input type="number" step="0.5" placeholder="kg" data-ex="${name}" data-sub="${si}" data-set="${s}" data-wk="${wk}" value="${kv}">
                              <input type="number" step="1" placeholder="reps" data-ex="${name}" data-sub="${si}" data-set="${s}" data-wk="${wk}" value="${rv}"></div>`;
        }
        setsHtml += `<div class="set"><label>${sub} • ${setCount}×</label>${pairs}<div class="history">Máx W${wk}: <b>${maxKg(weekObj)||'—'}</b></div></div>`;
      });
      return `<div class="cards"><div class="card-ex">
        <h3>${name}</h3>
        <div class="meta"><span class="tag">${type}</span><span>${scheme}</span><span class="kg">${kgR}</span></div>
        <div class="row4"><div><label>Tempo</label><div>${tempo||'—'}</div></div>
                         <div><label>Descanso</label><div>${rest||'—'}</div></div>
                         <div><label>RIR</label><div>${rir||'—'}</div></div><div></div></div>
        <div class="sets">${setsHtml}</div>
        <div class="history"><b>Historial:</b> ${hist}</div>
      </div></div>`;
    }).join('');
    container.innerHTML=html;
    container.querySelectorAll('input[type=number]').forEach(inp=>{
      inp.addEventListener('input',ev=>{
        const el=ev.target; const ex=el.dataset.ex; const sub=parseInt(el.dataset.sub,10); const set=parseInt(el.dataset.set,10); const wk=parseInt(el.dataset.wk,10);
        const field = (el.placeholder==='kg')?'kg':'reps';
        setCell(progress,state.person,state.day,ex,wk,sub,set,field,el.value);
        const card = el.closest('.card-ex');
        const histDiv = card.querySelector('.history'); if(histDiv) histDiv.innerHTML = `<b>Historial:</b> ${historyString(progress,state.person,state.day,ex)}`;
        const setBox = el.closest('.set').querySelector('.history b');
        const weekObj = getWeek(progress,state.person,state.day,ex,wk,sub,set+1);
        if(setBox) setBox.textContent = maxKg(weekObj) || '—';
      });
    });
  }
}
