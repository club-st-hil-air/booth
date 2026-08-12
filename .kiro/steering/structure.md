# Project Structure

```
booth/
├── index.html              # HTML shell + CSS theme-token definitions (:root / [data-theme])
├── vite.config.ts          # base '/booth/', dev server 0.0.0.0:5173, dist/ build
├── tsconfig.json           # strict TypeScript, noEmit (Vite handles transpile)
├── package.json            # name: stand-consult-reactnative
├── public/
│   └── images/             # fallback equipment photos (glider/harness/reserve.jpg)
├── .github/workflows/
│   └── deploy.yml          # GitHub Pages CI on push to main
└── src/
    ├── main.tsx            # React entry — mounts <App> inside providers
    ├── App.tsx             # root component: state, data fetch, filtering, layout orchestration
    ├── types.ts            # domain types: ArticleRaw, ArticleItem, Lot, FilterState, …
    ├── styles.css          # global styles (uses the CSS variables from index.html)
    ├── data/
    │   └── mockData.ts     # S3 URLs (PROD/TEST/DEFAULT)
    ├── i18n/
    │   ├── translations.ts # all UI strings for fr|en|es|de, keyed by TranslationKey
    │   └── I18nContext.tsx # I18nProvider, useI18n(), LanguageSelector
    ├── theme/
    │   ├── theme.ts        # design tokens (light/dark colours, spacing, radius, typo)
    │   └── ThemeContext.tsx# ThemeProvider, useTheme()
    ├── utils/
    │   ├── articleUtils.ts # groupRawIntoLots, filterArticles, homologation classification, TYPE_MAP
    │   └── imageUtils.ts   # Wikimedia image lookup + fallback image resolution
    └── components/
        ├── Header.tsx
        ├── FilterBar.tsx
        ├── ArticleCard.tsx        # grid view card
        ├── ArticleTable.tsx       # table view
        ├── ArticleDetailModal.tsx # per-lot detail + seller contact + prev/next nav
        ├── ArticleCompareModal.tsx# side-by-side comparison (max 4 lots)
        ├── PTVCalculatorModal.tsx # flying-weight → PTV filter helper
        ├── SettingsModal.tsx      # API URL + auto-refresh interval
        └── StatsBar.tsx           # inventory stats footer
```

## Where things live

- **Domain logic** → `src/utils/`. The raw S3 record → `Lot` transformation
  (`groupRawIntoLots`), all filtering (`filterArticles`), and homologation
  classification live here as pure functions. Keep components presentational and
  push logic into these helpers.
- **App state** → `App.tsx`. There is no store or router. Filters, sort, view
  mode, selected lot, favorites, compare set, and the modal-visibility flags are
  all `useState` in `App.tsx` and threaded down as props.
- **New UI string** → add the key to **every** language block in
  `translations.ts`, then consume via `t('key')`. TypeScript will fail the build
  if a key is missing from a language.
- **Colour / theme change** → edit `src/theme/theme.ts` **and** the mirrored CSS
  variables in `index.html`. Components read the CSS variables (`var(--accent)`),
  not the TS tokens directly, at render time.
- **Navigation** → modal-based. Deep-linking to a lot is via `?lot=` / `?coupon=`
  query params, resolved in `App.tsx` after data loads.

## Naming & style

- **Components**: PascalCase files, one component per file, default to named exports.
- **Domain fields** keep their French source names (`prixVente`, `PTVMin`,
  `telephoneVendeur`) through the `ArticleRaw` boundary; the normalised `Lot`
  keeps them too for continuity — do not rename mid-pipeline.
- **Categories** are string codes (`'0'`–`'3'`) mapped through `TYPE_MAP`; never
  hard-code the label/icon/colour, look it up.
- Comments and identifiers in **English**; user-facing copy in the four locales.
