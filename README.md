# Stand d'Occasion — Coupe Icare

Application web publique, en lecture seule, pour consulter le **stand de matériel
de parapente d'occasion de la Coupe Icare**, tenu par le Club Saint-Hilaire. Les
pilotes parcourent les lots en vente en temps réel depuis leur téléphone en se
promenant sur le stand, filtrent selon leurs besoins et récupèrent les
coordonnées du vendeur.

C'est un **outil de consultation uniquement** — pas de paiement, pas de mise en
vente, pas de panier. Les vendeurs et les prix sont gérés ailleurs ; l'appli
affiche un instantané en direct de l'inventaire du stand, récupéré depuis un flux
JSON sur S3.

## Fonctionnalités

- **Inventaire en direct** récupéré depuis S3, avec rafraîchissement automatique
  (60 s par défaut) et repli gracieux sur un jeu de données de test/hors-ligne
  quand le flux principal est injoignable ou dépasse le délai.
- **Vues grille et tableau** des lots, avec tri et recherche plein texte
  multi-mots.
- **Filtres riches** : catégorie (voile / sellette / secours / accessoire),
  marque, homologation, profil de pratique (école / progression / performance /
  léger / biplace), fourchette de prix et favoris.
- **Calculateur de PTV** — saisissez votre poids total volant pour trouver les
  voiles dont la fourchette de vol homologuée l'englobe, avec le positionnement
  (bas / milieu / haut) dans la fourchette.
- **Badges d'homologation en couleur** (EN A→D, équivalences LTF, CCC).
- **Fiche détail du lot** avec les coordonnées du vendeur, le numéro de coupon et
  la navigation précédent/suivant ; **fenêtre de comparaison** jusqu'à 4 lots
  côte à côte.
- **Lien profond** vers un lot précis via les paramètres d'URL `?lot=` /
  `?coupon=`.
- **Mobile d'abord**, thème clair/sombre, et quatre langues : français (par
  défaut), anglais, espagnol, allemand.
- **Persistance locale uniquement** : favoris, langue et URL d'API personnalisée
  sont stockés dans le `localStorage` du navigateur. Pas de cookies, pas
  d'écriture côté serveur.

## Stack technique

- **React 18** + **TypeScript** (strict), construit avec **Vite 8**.
- **react-native-web** — les composants utilisent les primitives RN-web et des
  styles en ligne, rendus dans le DOM. C'est une appli web, pas un build natif.
- **lucide-react** pour les icônes.
- Pas de framework CSS, pas de librairie d'état, pas de routeur : l'état est local
  à `App.tsx` et la navigation se fait par modales + paramètres d'URL.

## Démarrage

Nécessite Node 20+.

```bash
npm install      # installe les dépendances
npm run dev      # serveur de dev Vite sur http://0.0.0.0:5173/booth/
npm run build    # build de production typé vers dist/
npm run preview  # prévisualise le build de production
```

Le serveur de dev utilise par défaut le **jeu de données de test** pour permettre
de travailler hors-ligne ; la source de données se change à l'exécution via la
fenêtre Réglages de l'appli, ou en éditant `src/data/mockData.ts`.

### Garde-fou qualité

Il n'y a ni script de lint ni script de test — **la sûreté de typage est le
garde-fou qualité**. Lancez ceci avant chaque commit et gardez-le à zéro erreur :

```bash
npx tsc --noEmit
```

## Structure du projet

```
src/
├── main.tsx            # point d'entrée React — monte <App> dans les providers
├── App.tsx             # racine : état, récupération des données, filtrage, orchestration du layout
├── types.ts            # types métier (ArticleRaw, ArticleItem, Lot, FilterState)
├── data/mockData.ts    # URLs S3 (PROD / TEST / DEFAULT)
├── i18n/               # traductions (fr|en|es|de) + I18nContext
├── theme/              # tokens de design (clair/sombre) + ThemeContext
├── utils/              # logique métier : groupRawIntoLots, filterArticles, homologation
└── components/         # Header, FilterBar, ArticleCard, ArticleTable, modales, StatsBar
```

La logique métier vit dans `src/utils/` sous forme de fonctions pures ; les
composants restent présentationnels. La transformation enregistrement S3 brut →
`Lot` se fait en un seul endroit (`groupRawIntoLots`).

## Concepts métier

- **Lot** — l'unité vendue. Regroupe un ou plusieurs **articles** sous un même
  `idLot` / numéro de coupon et prix. Quand un lot mélange les types, la voile est
  promue article principal.
- **Article** — un élément dans un lot. Catégories : `0` Voile, `1` Sellette,
  `2` Secours, `3` Accessoire.
- **PTV** (Poids Total Volant) — la fourchette de vol homologuée d'une voile
  (`PTVMin`–`PTVMax`).
- **Homologation** — classe de certification sur l'échelle accessible→performance
  (EN A→D, équivalences LTF, CCC = compétition). La note EN fait foi ; la LTF est
  une correspondance de repli documentée.

## Internationalisation

Toutes les chaînes de l'UI vivent dans `src/i18n/translations.ts`, indexées par
`TranslationKey` sur `fr | en | es | de` et consommées via le helper
`t(key, params)` de `useI18n()`. Le français sert de repli pour toute clé
manquante. **Chaque nouvelle chaîne visible par l'utilisateur doit être ajoutée
dans les quatre langues** — TypeScript signale une `TranslationKey` incomplète.

## Thème

Les tokens clair/sombre sont définis dans `src/theme/theme.ts` et reflétés en
propriétés CSS personnalisées (`--bg-app`, `--accent`, `--state-*`, …) dans
`index.html`. Les composants référencent les variables CSS au rendu ; gardez donc
`theme.ts` et les blocs `:root` / `[data-theme]` de `index.html` synchronisés
lors d'un changement de couleurs.

## Déploiement

Déployé sur **GitHub Pages** via `.github/workflows/deploy.yml` à chaque push sur
`main` (Node 20, `npm ci` → `npm run build` → déploiement de `dist/`). La `base`
Vite est `/booth/`, donc les chemins d'assets et d'images doivent respecter cette
base.
