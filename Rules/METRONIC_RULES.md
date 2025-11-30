# Metronic Rules for Pixel Rank CRM V2

1. Use the Metronic Tailwind React starter kit with Vite as the only frontend app:
   client/metronic/metronic-v9.3.6/metronic-tailwind-react-starter-kit/typescript/vite

2. Never modify files inside client/metronic except when explicitly asked.
   Treat these as vendor code.

3. Layout source of truth:
   The app must match the online Metronic Vite Layout 14 demo.
   Do not rebuild the layout or structure from scratch.

4. When adding new screens:
   • Copy an existing Layout 14 page inside the starter app.
   • Keep header, sidebar, page container, and toolbar structure unchanged.
   • Only change inner content of the main page body.

5. HTML starter kits, demo folders, and concept folders are design reference only.
   They must not be wired into the build or imported into the main app.
