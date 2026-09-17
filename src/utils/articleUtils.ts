import { Article, ArticleItem, ArticleRaw, Lot, SortField } from '../types';

/**
 * Decode HTML entities (&#039; -> ', &amp; -> &, &quot; -> ", ...) coming from the
 * upstream JSON, which stores depositor-entered text HTML-escaped. Uses the browser's
 * native parser (handles every entity); falls back to a small table when the DOM is
 * unavailable (SSR / tests).
 */
export function decodeEntities(input: string): string {
  if (!input || input.indexOf('&') === -1) return input;
  if (typeof document !== 'undefined') {
    const el = document.createElement('textarea');
    el.innerHTML = input;
    return el.value;
  }
  return input
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#0*34;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Map of known colour names (FR + EN + a few common commercial colourway names)
 * to a display hex, keyed by a normalised token (lowercase, accent-stripped).
 * Used to render a small colour swatch row for gliders. Unknown tokens are ignored.
 */
const COLOR_NAME_TO_HEX: Record<string, string> = {
  // French
  rouge: '#e53935', orange: '#fb8c00', jaune: '#fdd835', vert: '#43a047', verte: '#43a047',
  bleu: '#1e88e5', bleue: '#1e88e5', violet: '#8e24aa', violette: '#8e24aa', rose: '#ec407a',
  noir: '#212121', noire: '#212121', blanc: '#fafafa', blanche: '#fafafa', gris: '#9e9e9e', grise: '#9e9e9e',
  marron: '#795548', turquoise: '#26c6da', lime: '#c0ca33', corail: '#ff7043', argent: '#bdbdbd', or: '#ffd700',
  // English
  red: '#e53935', green: '#43a047', blue: '#1e88e5', yellow: '#fdd835', purple: '#8e24aa',
  pink: '#ec407a', black: '#212121', white: '#fafafa', grey: '#9e9e9e', gray: '#9e9e9e',
  brown: '#795548', coral: '#ff7043', silver: '#bdbdbd', gold: '#ffd700', lavender: '#b39ddb',
  // Commercial colourway names that map unambiguously
  ocean: '#0277bd', azur: '#039be5', azzurro: '#039be5', azura: '#039be5', petrol: '#00838f',
  sunset: '#ff7043', fire: '#e53935', flame: '#e53935', citrus: '#c0ca33', acid: '#c0ca33',
  forest: '#2e7d32', royal: '#1565c0', polar: '#e3f2fd', lilac: '#ce93d8',
};

/**
 * Parse a free-text colour field ("Rouge/Noir/Blanc", "bleu blanc jaune",
 * "Verte-orange") into a list of {name, hex} swatches. Splits on separators,
 * normalises each token, and keeps only tokens that resolve to a known colour.
 * Order and duplicates within the string are preserved (deduped by hex).
 */
export function parseColors(couleurVoile: string): { name: string; hex: string }[] {
  if (!couleurVoile) return [];
  const tokens = couleurVoile
    .split(/[\s,/\-–—+&()]+|\bet\b|\bplus\b/i)
    .map((t) => t.trim())
    .filter(Boolean);
  const out: { name: string; hex: string }[] = [];
  const seen = new Set<string>();
  for (const tok of tokens) {
    const key = tok.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const hex = COLOR_NAME_TO_HEX[key];
    if (hex && !seen.has(hex)) {
      seen.add(hex);
      out.push({ name: tok, hex });
    }
  }
  return out;
}

export const TYPE_MAP: Record<string, { label: string; translationKey: string; icon: string; color: string; bg: string }> = {
  '0': { label: 'Voile', translationKey: 'typeGlider', icon: '🪂', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  '1': { label: 'Sellette', translationKey: 'typeHarness', icon: '💺', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  '2': { label: 'Secours', translationKey: 'typeReserve', icon: '🆘', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  '3': { label: 'Accessoire', translationKey: 'typeAccessory', icon: '🛠', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
};

export type HomologationLevel = 'a' | 'b' | 'c' | 'd' | 'ccc' | '';

/**
 * Classify a homologation string on the accessible → performance ladder for colour-coding.
 * EN rating is authoritative; falls back to the standard LTF ↔ EN correspondence
 * (LTF 1 ≈ A, LTF 1-2 ≈ B, LTF 2 ≈ C, LTF 2-3 / LTF 3 ≈ D). CCC = competition.
 */
export function getHomologationLevel(homologation: string): HomologationLevel {
  const h = (homologation || '').toUpperCase();
  if (!h) return '';
  if (h.includes('CCC')) return 'ccc';
  // EN rating (authoritative) — check D→A so a dual "EN C/D" reads as the higher class first.
  if (/\bEN[\s-]*D\b/.test(h)) return 'd';
  if (/\bEN[\s-]*C\b/.test(h)) return 'c';
  if (/\bEN[\s-]*B\b/.test(h)) return 'b';
  if (/\bEN[\s-]*A\b/.test(h)) return 'a';
  // LTF fallback — order matters: match the ranges before the single digits.
  if (h.includes('LTF 3') || h.includes('LTF-3')) return 'd';
  if (h.includes('2-3')) return 'd';
  if (h.includes('1-2')) return 'b';
  if (h.includes('LTF 2') || h.includes('LTF-2')) return 'c';
  if (h.includes('LTF 1') || h.includes('LTF-1')) return 'a';
  return '';
}

/** Icon/text colour for a homologation level, matching the CSS badge classes. */
export const HOMOLOGATION_COLORS: Record<HomologationLevel, string> = {
  a: 'var(--state-new)',
  b: 'var(--state-good)',
  c: 'var(--state-worn)',
  d: 'var(--danger)',
  ccc: '#a855f7',
  '': 'var(--text-muted)',
};

/** Numeric order on the accessible → performance ladder, for sorting by homologation. */
export const HOMOLOGATION_SORT_ORDER: Record<HomologationLevel, number> = {
  a: 1,
  b: 2,
  c: 3,
  d: 4,
  ccc: 5,
  '': 99,
};

/**
 * Total-order sort key for the free-text `taille` field, which mixes garment
 * sizes (S/M/L…), numeric wing/harness sizes ("20", "12,5") and free text.
 * Ordering: known garment sizes (ranked), then numeric sizes, then the rest
 * alphabetically — keeping the comparator transitive across all values.
 */
const TAILLE_RANK: Record<string, number> = {
  XXS: 1, XS: 2, S: 3, 'X-S': 2, 'M/S': 3.5, 'S/M': 3.5, M: 4, 'M/L': 4.5, L: 5, XL: 6, 'X-L': 6, XXL: 7, XXXL: 8,
};
export function getTailleSortKey(raw: string): [number, number, string] {
  const s = (raw || '').trim().toUpperCase();
  if (s in TAILLE_RANK) return [0, TAILLE_RANK[s], s];
  const n = parseFloat(s.replace(',', '.'));
  if (!isNaN(n)) return [1, n, s];
  return [2, 0, s];
}

/**
 * Sort criteria relevant to a given category. When no type is selected ('ALL')
 * or for accessories, only the universally meaningful sorts are offered; gliders
 * add weight range (PTV) and certification, harnesses/reserves add size.
 */
export function getSortFieldsForType(typeCode: string): SortField[] {
  switch (typeCode) {
    case '0': // Voile / glider
      return ['numeroCoupon', 'prixVente', 'marque', 'PTVMax', 'homologation', 'annee'];
    case '1': // Sellette / harness
    case '2': // Secours / reserve
      return ['numeroCoupon', 'prixVente', 'marque', 'taille', 'annee'];
    default: // '3' accessory and 'ALL' → most common sorts
      return ['numeroCoupon', 'prixVente', 'marque', 'annee'];
  }
}

/** Pick the article of the selected type within a lot (mixed lots promote the glider as primary). */
export function articleForType(lot: Lot, selectedType: string): ArticleItem {
  if (selectedType !== 'ALL') {
    const match = lot.articles.find((a) => a.typeCode === selectedType);
    if (match) return match;
  }
  return lot.primaryArticle;
}

/** Sort fields for which a grouped separator (by shared value) is meaningful. */
export const GROUPABLE_SORT_FIELDS: SortField[] = ['marque', 'homologation', 'annee', 'taille'];

/** Grouping key for a lot under the active sort, or null when the field isn't groupable. */
export function getGroupValue(lot: Lot, sortField: SortField, selectedType: string): string | null {
  if (!GROUPABLE_SORT_FIELDS.includes(sortField)) return null;
  const art = articleForType(lot, selectedType);
  switch (sortField) {
    case 'marque': return (art.marque || '').toUpperCase();
    case 'annee': return art.annee || '';
    case 'taille': return (art.taille || '').toUpperCase();
    case 'homologation': return getHomologationLevel(art.homologation);
    default: return null;
  }
}

/** Human label for a group value under the active sort (translated fallbacks for empty values). */
export function formatGroupLabel(sortField: SortField, value: string, t: (key: any) => string): string {
  if (sortField === 'homologation') {
    const labels: Record<string, string> = { a: 'EN A', b: 'EN B', c: 'EN C', d: 'EN D', ccc: 'CCC' };
    return labels[value] ?? t('groupNoHomologation');
  }
  if (!value) {
    if (sortField === 'marque') return t('noBrand');
    if (sortField === 'annee') return t('groupNoYear');
    if (sortField === 'taille') return t('groupNoSize');
    return '—';
  }
  return value;
}

/**
 * Group raw article items by `idLot` into rich `Lot` instances containing multiple `ArticleItem`s.
 */
export function groupRawIntoLots(rawArticles: ArticleRaw[]): Lot[] {
  if (!Array.isArray(rawArticles) || rawArticles.length === 0) {
    return [];
  }

  const lotMap = new Map<string, Lot>();

  rawArticles.forEach((raw) => {
    const key = raw.idLot;
    const typeInfo = TYPE_MAP[raw.type] || {
      label: `Type ${raw.type}`,
      icon: '📦',
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.15)',
    };

    const item: ArticleItem = {
      typeCode: raw.type || '3',
      typeLabel: typeInfo.label,
      typeIcon: typeInfo.icon,
      marque: decodeEntities((raw.marque || '').trim()),
      modele: decodeEntities((raw.modele || '').trim()),
      homologation: decodeEntities((raw.homologation || '').trim()),
      PTVMin: parseFloat(raw.PTVMin || '0') || 0,
      PTVMax: parseFloat(raw.PTVMax || '0') || 0,
      taille: decodeEntities((raw.taille || '').trim()),
      annee: (raw.annee || '').trim(),
      couleurVoile: decodeEntities((raw.couleurVoile || '').trim()),
      commentaire: decodeEntities((raw.commentaire || '').trim()),
    };

    if (!lotMap.has(key)) {
      const prix = parseFloat(raw.prixVente || '0') || 0;

      lotMap.set(key, {
        idLot: raw.idLot || '',
        numeroCoupon: raw.numeroCoupon || raw.idLot || '',
        prixVente: prix,
        prixVenteStr: `${prix} €`,
        statut: raw.statut || 'En vente',
        articles: [item],
        primaryArticle: item,
        title: `${item.marque} ${item.modele}`.trim(),
      });
    } else {
      const lot = lotMap.get(key)!;
      lot.articles.push(item);

      // If primary article is not a glider ('0') and the new item IS a glider, promote glider as primary!
      if (lot.primaryArticle.typeCode !== '0' && item.typeCode === '0') {
        lot.primaryArticle = item;
      }

      // Rebuild summary title
      lot.title = lot.articles.map((a) => `${a.marque} ${a.modele}`.trim()).filter(Boolean).join(' + ');
    }
  });

  return Array.from(lotMap.values());
}

/**
 * Filter lots based on user query and filter criteria across all sub-articles in each lot.
 */
export function filterArticles(
  lots: Lot[],
  query: string,
  status: string,
  typeCode: string,
  brand: string,
  homologation: string,
  profile: string,
  minPrice: string,
  maxPrice: string,
  ptvTarget: string,
  onlyFavorites: boolean,
  favoriteIds: Set<string>
): Lot[] {
  const queryWords = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const minPriceNum = minPrice ? parseFloat(minPrice) : null;
  const maxPriceNum = maxPrice ? parseFloat(maxPrice) : null;
  const ptvTargetNum = ptvTarget ? parseFloat(ptvTarget) : null;

  return lots.filter((lot) => {
    // Favorites filter
    if (onlyFavorites && !favoriteIds.has(lot.idLot)) {
      return false;
    }

    // Status filter
    if (status !== 'ALL') {
      const sNorm = status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const lotStatutNorm = lot.statut.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (sNorm.includes('vente') && !lotStatutNorm.includes('vente')) {
        return false;
      } else if (!sNorm.includes('vente') && !lotStatutNorm.includes(sNorm)) {
        return false;
      }
    }

    // Category Type filter (matches if ANY article in the lot is of that type)
    if (typeCode !== 'ALL' && !lot.articles.some((a) => a.typeCode === typeCode)) {
      return false;
    }

    // Brand filter (matches if ANY article in the lot is of that brand)
    if (brand !== 'ALL' && !lot.articles.some((a) => a.marque.toUpperCase() === brand.toUpperCase())) {
      return false;
    }

    // Homologation filter (matches if ANY article in the lot matches)
    if (homologation !== 'ALL' && !lot.articles.some((a) => a.homologation === homologation)) {
      return false;
    }

    // Practice Profile filter
    if (profile !== 'ALL') {
      const matchProfile = lot.articles.some((a) => {
        const hUpper = a.homologation.toUpperCase();
        const mUpper = `${a.marque} ${a.modele} ${a.commentaire}`.toUpperCase();

        if (profile === 'school') {
          return hUpper.includes('EN A') || hUpper.includes('LTF 1') || hUpper.includes('LTF-1');
        } else if (profile === 'progression') {
          return hUpper.includes('EN B') || hUpper.includes('LTF 1-2') || hUpper.includes('LTF 2');
        } else if (profile === 'performance') {
          return hUpper.includes('EN C') || hUpper.includes('EN D') || hUpper.includes('CCC') || hUpper.includes('LTF 2-3') || hUpper.includes('LTF 3');
        } else if (profile === 'light') {
          return mUpper.includes('LIGHT') || mUpper.includes('RANDO') || mUpper.includes('SINGLE') || mUpper.includes('SKIN') || mUpper.includes('PLUME') || mUpper.includes('ULTRALIGHT');
        } else if (profile === 'tandem') {
          return mUpper.includes('BI') || mUpper.includes('TANDEM') || mUpper.includes('DUO') || mUpper.includes('SAFARI') || mUpper.includes('TAKOO') || mUpper.includes('FUSE') || mUpper.includes('BIPLACE');
        }
        return false;
      });

      if (!matchProfile) return false;
    }

    // Min / Max Price
    if (minPriceNum !== null && lot.prixVente < minPriceNum) {
      return false;
    }
    if (maxPriceNum !== null && lot.prixVente > maxPriceNum) {
      return false;
    }

    // PTV Target Matching (matches ONLY lots containing a glider '0' whose PTV range encompasses target PTV)
    if (ptvTargetNum !== null) {
      const gliders = lot.articles.filter((a) => a.typeCode === '0' && (a.PTVMin > 0 || a.PTVMax > 0));
      if (gliders.length === 0) {
        return false;
      }
      const hasGliderMatch = gliders.some((g) => {
        const minBound = g.PTVMin > 0 ? g.PTVMin : 0;
        const maxBound = g.PTVMax > 0 ? g.PTVMax : 999;
        return ptvTargetNum >= minBound && ptvTargetNum <= maxBound;
      });
      if (!hasGliderMatch) return false;
    }

    // Full text multi-word search in all fields across all sub-articles
    if (queryWords.length > 0) {
      const haystack = [
        lot.idLot,
        lot.numeroCoupon,
        lot.statut,
        lot.title,
        ...lot.articles.map((a) => `${a.typeLabel} ${a.marque} ${a.modele} ${a.homologation} ${a.taille} ${a.annee} ${a.couleurVoile} ${a.commentaire}`),
      ]
        .join(' ')
        .toLowerCase();

      return queryWords.every((word) => haystack.includes(word));
    }

    return true;
  });
}
