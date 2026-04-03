# BuildScale Angular — TypeScript Migration

A full Angular 17 (standalone components) TypeScript migration of the original vanilla JS `QuantityMeasurementFrontend`.

## Project Structure

```
buildscale-angular/
├── angular.json
├── package.json
├── tsconfig.json
├── tsconfig.app.json
└── src/
    ├── index.html
    ├── main.ts
    ├── styles.css                     ← Global styles (light + dark themes via CSS vars)
    ├── environments/
    │   ├── environment.ts             ← Dev: apiUrl = http://localhost:5001
    │   └── environment.prod.ts
    └── app/
        ├── app.component.ts           ← Root bootstrap, calls ThemeService.initTheme()
        ├── app.config.ts              ← Router + HttpClient providers
        ├── app.routes.ts              ← Routes: / /auth /history /profile
        ├── guards/
        │   └── auth.guard.ts          ← Redirects to /auth if no token
        ├── models/
        │   └── quantity.models.ts     ← All interfaces + UNIT_MAP
        ├── services/
        │   ├── auth.service.ts        ← login/signup/logout/pending queue/flush
        │   ├── quantity.service.ts    ← API calls: perform/save/history/profile
        │   ├── theme.service.ts       ← Dark/light toggle (signal + localStorage)
        │   └── toast.service.ts       ← Global toast notifications
        └── components/
            ├── navbar/                ← Sticky nav with theme toggle switch
            ├── home/                  ← Hero + operations grid + modal + result panel
            ├── auth/                  ← Login / signup with Google OAuth
            ├── history/               ← Protected: table + filter + delete
            └── profile/               ← Protected: user info + stats
```

## Getting Started

```bash
npm install
ng serve
```

Navigate to `http://localhost:4200`.

Make sure your backend is running at `http://localhost:5001` (or update `src/environments/environment.ts`).

## Theme Toggle

- A sun/moon toggle switch lives in the **Navbar** (and also on the Auth page).
- Light theme = original cream/sage color palette (unchanged).
- Dark theme = deep olive-black backgrounds with inverted palette.
- Preference is saved to `localStorage` under the key `theme`.

## What Changed vs. Original

| Aspect | Original | Angular |
|---|---|---|
| Language | Vanilla JS | TypeScript (strict) |
| Routing | Multi-HTML files | Angular Router (SPA) |
| State | Global variables | Angular Signals |
| API calls | Inline `fetch` | Extracted into services |
| Theme | Light only | Light + Dark via CSS custom properties |
| Architecture | Flat files | Components / Services / Guards / Models |

## What Did NOT Change

- All JS **logic and API call behaviour** is preserved 1-to-1.
- All CSS **class names** and visual styles are identical.
- The light theme color palette is byte-for-byte the same.
- Google OAuth redirect flow works identically.
- Pending operations queue logic is preserved exactly.
