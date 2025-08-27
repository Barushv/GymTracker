export const KEYS = { state:'pwa-state', progress:'pwa-progress', oneRM:'pwa-1rm', theme:'pwa-theme' };
const LS = { get(k,d){ try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;} },
             set(k,v){ try{localStorage.setItem(k,JSON.stringify(v));}catch{} } };
export function loadAll(defaultState){
  const prog = LS.get(KEYS.progress, {});
  return { state:LS.get(KEYS.state, defaultState),
           progress:prog,
           oneRM:LS.get(KEYS.oneRM, null) || {"fercho":{"Hip Thrust":216,"Peso Rumano":37.8,"Búlgara (por mano)":28,"Abducción Máquina":148.4,"Pantorrilla de pie":120.4},"andy":{"Hip Thrust":172.6667,"Peso Rumano":28,"Búlgara (por mano)":21,"Abducción Máquina":112,"Pantorrilla de pie":81.2}},
           theme:localStorage.getItem(KEYS.theme)||'emerald' };
}
export function saveState(s){ LS.set(KEYS.state, s); }
export function saveProgress(p){ LS.set(KEYS.progress, p); }
export function saveOneRM(rm){ LS.set(KEYS.oneRM, rm); }
export function saveTheme(t){ try{localStorage.setItem(KEYS.theme,t);}catch{} }
export function backup(data){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url; a.download='hypertrophy_backup.json'; a.click(); URL.revokeObjectURL(url);
}
