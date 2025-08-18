Hypertrophy Tracker – PWA
=================================
Qué incluye
-----------
- index.html: app en JS/HTML plano con rutinas de Fercho y su novia, %1RM, RIR, TUT y progresión S1–S4 guardada en localStorage.
- app.webmanifest: manifiesto PWA.
- sw.js: service worker para funcionar offline.
- icons/: íconos (maskable incluidos).

Cómo usarla rápido (en tu compu)
--------------------------------
Opción A) Servidor local de Python:
  1) Abre una terminal en esta carpeta y ejecuta:
     python3 -m http.server 8080
  2) Entra a http://localhost:8080  y verás la app.
  3) Click en “Instalar” o usa el menú del navegador para instalar en tu equipo.

Opción B) GitHub Pages / Netlify (https)
  - Sube estos archivos a un hosting estático (GitHub Pages, Netlify, Vercel). Al abrir la URL podrás instalarla en tu móvil.

Cómo exportar registros
-----------------------
- Botón “Exportar CSV (día)” genera un CSV del día mostrado con tus cargas/Notas S1–S4.

Notas
-----
- Los rangos de carga se redondean a 0.5 kg y se calculan con los % de 1RM embebidos.
- Los ejercicios sin 1RM muestran “Autoajuste” (usa RIR objetivo).
- Domingo: LISS 35–45′ + core 8–12′, sin glúteo.
