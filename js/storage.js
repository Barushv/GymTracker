export const KEYS = { state:'pwa-state', progress:'pwa-progress', oneRM:'pwa-1rm', theme:'pwa-theme' };
const LS = { get(k,d){ try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;} },
             set(k,v){ try{localStorage.setItem(k,JSON.stringify(v));}catch{} } };
export function loadAll(def){ return { state:LS.get(KEYS.state, def), progress:LS.get(KEYS.progress, {}), oneRM:LS.get(KEYS.oneRM, {"fercho":{},"andy":{}}), theme:localStorage.getItem(KEYS.theme)||'emerald' }; }
export function saveState(s){ try{localStorage.setItem(KEYS.state, JSON.stringify(s));}catch{} }
export function saveProgress(p){ try{localStorage.setItem(KEYS.progress, JSON.stringify(p));}catch{} }
export function saveOneRM(rm){ try{localStorage.setItem(KEYS.oneRM, JSON.stringify(rm));}catch{} }
export function saveTheme(t){ try{localStorage.setItem(KEYS.theme,t);}catch{} }
export function backup(data){ const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='hypertrophy_backup.json'; a.click(); URL.revokeObjectURL(url); }
