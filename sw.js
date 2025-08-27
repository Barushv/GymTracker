const CACHE='ht-4-6-2';
const PRECACHE=[ './','./index.html','./css/style.css','./js/app.js','./js/ui.js','./js/storage.js',
  './data/routines.json','./data/defaults_1rm.json','./app.webmanifest','./icons/icon-192.png','./icons/icon-512.png' ];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE))); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch', e=>{
  const r=e.request; if(r.method!=='GET') return;
  e.respondWith(caches.match(r).then(c=>c||fetch(r).then(resp=>{const copy=resp.clone(); caches.open(CACHE).then(ca=>ca.put(r,copy)); return resp;}).catch(()=>caches.match('./index.html'))));
});
