# Product

## What this is

A public, read-only web app for consulting the **second-hand paragliding gear
stand ("stand d'occasion") at the Coupe Icare**, run by Club Saint-Hilaire.
Visitors browse the lots on sale in real time from their phone while walking the
stand, filter by their needs, and get the seller's contact details.

The app is a **consultation tool only** — it does not handle payments, listings,
or checkout. Sellers and prices are managed elsewhere; this app renders a
live snapshot of the stand's inventory.

## Users

- **Buyers at the event**: pilots browsing on mobile at the physical stand.
  Mobile-first is the priority. They scan cards, open a detail modal to act
  (see the seller's phone, coupon number).
- **Remote buyers**: pilots checking availability before travelling.

Users are international paragliding pilots — the UI is available in **French
(default), English, Spanish, and German**.

## Domain concepts

- **Lot** — the unit sold. A lot groups one or more **articles** under a single
  `idLot` / coupon number and price. Example: a glider + harness sold together.
- **Article** — an individual item within a lot. Four categories:
  - `0` Voile (glider) `1` Sellette (harness) `2` Secours (reserve) `3` Accessoire.
  - When a lot mixes types, the **glider is promoted to the primary article**
    (it's what pilots search on).
- **PTV** (Poids Total Volant / all-up flying weight) — a glider's certified
  weight range (`PTVMin`–`PTVMax`, the "fourchette de vol"). The PTV filter and
  calculator match gliders whose range **encompasses** the pilot's flying weight
  and indicate positioning within it (low/mid/high) to signal glider behaviour.
- **Homologation** — the certification class on the accessible→performance
  ladder (EN A→D, LTF equivalents, CCC = competition). Colour-coded badges.
  EN rating is authoritative; LTF is a documented fallback correspondence.
- **Practice profile** — a derived filter (school / progression / performance /
  light / tandem) inferred from homologation + brand/model/comment keywords.

## Product principles

- **Mobile-first.** The stand is browsed on phones; layout, tap targets, and
  performance target small screens first.
- **Real, correct paragliding terminology** in every language. Terms like
  "fourchette de vol" / "certified weight range" matter to this audience — never
  invent or loosely translate them.
- **Live but resilient.** Data auto-refreshes; the app degrades gracefully to a
  test/offline dataset and surfaces clear error/offline banners rather than
  breaking.
- **Read-only and safe.** No user data is written server-side; favorites, language,
  and settings live only in the browser's localStorage.
