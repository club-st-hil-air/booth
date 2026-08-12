# Technology

## Stack

- **React 18** + **TypeScript** (strict mode), built with **Vite 8**.
- **react-native-web** — components are written with RN-web primitives/patterns
  and inline styles, rendered to the DOM. Despite the package name
  (`stand-consult-reactnative`), this is a **web app**, not a native build.
- **lucide-react** for all icons — never hand-roll inline SVG icons.
- No CSS framework: styling is a mix of a global `src/styles.css`, CSS custom
  properties (theme tokens) declared in `index.html`, and inline style objects.
- No state library, no router, no test framework currently configured. State is
  local React state in `App.tsx`; navigation is modal-based + URL query params
  (`?lot=` / `?coupon=` deep-links a lot's detail modal).

## Commands

```bash
npm run dev      # Vite dev server on 0.0.0.0:5173 (base path /booth/)
npm run build    # Type-checked production build to dist/
npm run preview  # Preview the production build
```

There is no lint or test script. **Type-safety is the quality gate**: run
`npx tsc --noEmit` before committing and keep it at zero errors.

## Data source

- Inventory is fetched as JSON from **S3** (see `src/data/mockData.ts`):
  - `PROD_S3_URL` — live stand data, used in production builds.
  - `TEST_S3_URL` — test/offline dataset, the dev default and the resilient
    fallback when the primary fetch fails or times out (3.5s abort).
- Fetches use `cache: 'no-store'` and auto-refresh on an interval (default 60s).
- Raw records (`ArticleRaw`, snake-ish French field names like `prixVente`,
  `PTVMin`, `telephoneVendeur`) are normalised into rich `Lot` objects by
  `groupRawIntoLots` in `src/utils/articleUtils.ts`. Keep the raw→domain mapping
  in that one place.

## Persistence

Browser `localStorage` only, versioned keys (`stand_consult_*_v1`): favorites,
selected language, custom API URL. No cookies, no backend writes.

## Theming & i18n

- **Theme**: light/dark tokens defined in `src/theme/theme.ts` and mirrored as
  CSS variables (`--bg-app`, `--accent`, `--state-*`, …) in `index.html`.
  Components reference the CSS variables; keep `theme.ts` and the `index.html`
  `:root` / `[data-theme]` blocks in sync when changing colours.
- **i18n**: `src/i18n/translations.ts` holds all strings keyed by
  `TranslationKey` across `fr | en | es | de`, consumed via the `useI18n()`
  `t(key, params)` helper. French is the fallback for any missing key.
  **Every new user-facing string must be added to all four languages** — a
  missing key silently falls back to French and TypeScript will flag an
  incomplete `TranslationKey` map.

## Deployment

- **GitHub Pages** via `.github/workflows/deploy.yml` on push to `main`
  (Node 20, `npm ci` → `npm run build` → deploy `dist/`).
- Vite `base` is `/booth/` — asset and image paths must respect this base;
  fallback images are referenced as `./images/...` from `public/images/`.

## Conventions

- **TypeScript strict**; prefer explicit domain types from `src/types.ts`.
- Icons via `lucide-react`.
- Repo-facing text (code, comments, commit messages) in **English**, even though
  the product UI and domain vocabulary are French-first.
- Favor pure, well-named helpers in `src/utils/` for domain logic (filtering,
  grouping, homologation classification) so components stay presentational.
