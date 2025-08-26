export const KEYS = { state:'pwa-state', progress:'pwa-progress', oneRM:'pwa-1rm', theme:'pwa-theme' };
const LS = { get(k,d){ try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;} },
             set(k,v){ try{localStorage.setItem(k,JSON.stringify(v));}catch{} } };
export function loadAll(defaultState){
  migrateNoviaToAndy();
  const prog = LS.get(KEYS.progress, {});
  const migratedWeeks = migrateWeeks(prog);
  if (migratedWeeks.changed) LS.set(KEYS.progress, migratedWeeks.data);
  return { state:LS.get(KEYS.state, defaultState),
           progress:migratedWeeks.data,
           oneRM:LS.get(KEYS.oneRM, null),
           theme:localStorage.getItem(KEYS.theme)||'emerald' };
}
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
    const daysOrEx = out[person]||{};
    Object.keys(daysOrEx).forEach(key=>{
      const maybeEx = daysOrEx[key];
      if (maybeEx && typeof maybeEx==='object' && (maybeEx.S1 || maybeEx.S2 || maybeEx.S3 || maybeEx.S4)){
        const nrow={};
        if(maybeEx.S1){ nrow.W1=maybeEx.S1; changed=true; }
        if(maybeEx.S2){ nrow.W2=maybeEx.S2; changed=true; }
        if(maybeEx.S3){ nrow.W3=maybeEx.S3; changed=true; }
        if(maybeEx.S4){ nrow.W4=maybeEx.S4; changed=true; }
        for (let i=1;i<=8;i++){ const k='W'+i; if(maybeEx[k]) nrow[k]=maybeEx[k]; }
        out[person][key]=nrow;
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
