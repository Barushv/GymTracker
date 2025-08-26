export const KEYS = { state:'pwa-state', progress:'pwa-progress', oneRM:'pwa-1rm', theme:'pwa-theme' };
const LS = { get(k,d){ try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;} },
             set(k,v){ try{localStorage.setItem(k,JSON.stringify(v));}catch{} } };
export function loadAll(defaultState){ migrateNoviaToAndy(); const prog = LS.get(KEYS.progress, {}); const migrated = migrateWeeks(prog);
  if (migrated.changed) LS.set(KEYS.progress, migrated.data);
  return { state:LS.get(KEYS.state, defaultState),
           progress:migrated.data,
           oneRM:LS.get(KEYS.oneRM, null),
           theme:localStorage.getItem(KEYS.theme)||'emerald' }; }
export function saveState(s){ LS.set(KEYS.state, s); }
export function saveProgress(p){ LS.set(KEYS.progress, p); }
export function saveOneRM(rm){ LS.set(KEYS.oneRM, rm); }
export function saveTheme(t){ try{localStorage.setItem(KEYS.theme,t);}catch{} }
function migrateNoviaToAndy(){ try{
  const rm=LS.get(KEYS.oneRM,null);
  if(rm && rm.novia && !rm.andy){ rm.andy=rm.novia; delete rm.novia; LS.set(KEYS.oneRM,rm); }
  const prog=LS.get(KEYS.progress,null);
  if(prog && prog.novia && !prog.andy){ prog.andy=prog.novia; delete prog.novia; LS.set(KEYS.progress,prog); }
  const st=LS.get(KEYS.state,null);
  if(st && st.person==='novia'){ st.person='andy'; LS.set(KEYS.state,st); }
} catch{} }
function migrateWeeks(progress){
  let changed=false; const out = JSON.parse(JSON.stringify(progress||{}));
  Object.keys(out||{}).forEach(person=>{
    const exs = out[person]||{};
    Object.keys(exs).forEach(ex=>{
      const row = exs[ex]||{};
      if (row.S1 || row.S2 || row.S3 || row.S4){
        const nrow={};
        if(row.S1){ nrow.W1=row.S1; changed=true; }
        if(row.S2){ nrow.W2=row.S2; changed=true; }
        if(row.S3){ nrow.W3=row.S3; changed=true; }
        if(row.S4){ nrow.W4=row.S4; changed=true; }
        for (let i=1;i<=8;i++){ const k='W'+i; if(row[k]) nrow[k]=row[k]; }
        out[person][ex]=nrow;
      }
    });
  });
  return {changed, data: out};
}
export function backup(data){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url; a.download='hypertrophy_backup.json'; a.click(); URL.revokeObjectURL(url);
}
