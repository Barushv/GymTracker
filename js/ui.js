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

function overview(p){ const ks=['W1','W2','W3','W4','W5','W6','W7','W8']; return ks.map(k=>p?.[k]||'').join(' | '); }

export function renderCardio(){ const root=document.getElementById('cardioList'); root.innerHTML= CARDIO.map(([d,mod,dur,nota])=>`<div class="cardio-row"><div class="day"><b>${d}</b></div><div class="mod">${mod}</div><div class="dur">${dur}</div><div class="note">${nota}</div></div>`).join(''); }
export function renderPlan(viewMode,routines,state,oneRM,progress){
  const plan=routines[state.person][state.day]; const wk=`W${state.week}`;
  const container=document.getElementById('planContainer');
  if(viewMode==='table'){
    container.innerHTML=`<div class="table-wrapper"><table id="planTable">
      <thead><tr><th>Ejercicio</th><th>Tipo</th><th>Esquema</th><th>Carga objetivo</th><th>Tempo</th><th>Descanso</th><th>RIR</th><th>${wk}</th><th class="muted">Historial W1–W8</th></tr></thead>
      <tbody></tbody></table></div>`;
    const tb=container.querySelector('tbody');
    plan.forEach(([name,type,scheme,load,tempo,rest,rir])=>{
      const p=(progress[state.person]?.[name])||{}; const val=p[wk]||'';
      const tr=document.createElement('tr');
      tr.innerHTML=`<td><b>${name}</b></td><td><span class="tag">${type}</span></td><td>${scheme}</td>
                    <td class="kg">${kgRange(oneRM,state.person,load)}</td><td>${tempo||'—'}</td><td>${rest||'—'}</td><td>${rir||'—'}</td>
                    <td><input data-ex="${name}" data-wk="${wk}" value="${val}" placeholder="kg/nota" style="width:120px"></td>
                    <td class="muted">${overview(p)}</td>`;
      tb.appendChild(tr);
    });
    tb.querySelectorAll('input').forEach(inp=>{
      inp.addEventListener('input',ev=>{
        const ex=ev.target.dataset.ex, w=ev.target.dataset.wk;
        progress[state.person]=progress[state.person]||{}; progress[state.person][ex]=progress[state.person][ex]||{};
        progress[state.person][ex][w]=ev.target.value; saveProgress(progress);
      });
    });
  } else {
    const html=plan.map(([name,type,scheme,load,tempo,rest,rir])=>{
      const p=(progress[state.person]?.[name])||{}; const val=p[wk]||'';
      return `<div class="cards"><div class="card-ex">
        <h3>${name}</h3>
        <div class="meta"><span class="tag">${type}</span><span>${scheme}</span><span class="kg">${kgRange(oneRM,state.person,load)}</span></div>
        <div class="row4"><div><label>Tempo</label><div>${tempo||'—'}</div></div>
                         <div><label>Descanso</label><div>${rest||'—'}</div></div>
                         <div><label>RIR</label><div>${rir||'—'}</div></div><div></div></div>
        <div class="row4"><div><label>${wk}</label><input data-ex="${name}" data-wk="${wk}" value="${val}" placeholder="kg/nota"></div>
                         <div class="help" style="grid-column:span 3"><b>Historial:</b> ${overview(p)}</div></div>
      </div></div>`;
    }).join('');
    container.innerHTML=html;
    container.querySelectorAll('input').forEach(inp=>{
      inp.addEventListener('input',ev=>{
        const ex=ev.target.dataset.ex, w=ev.target.dataset.wk;
        progress[state.person]=progress[state.person]||{}; progress[state.person][ex]=progress[state.person][ex]||{};
        progress[state.person][ex][w]=ev.target.value; saveProgress(progress);
      });
    });
  }
}
