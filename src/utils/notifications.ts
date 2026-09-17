import { Article, FilterState } from '../types';
import { TYPE_MAP } from './articleUtils';

const STORAGE_ALERT_KEY = 'stand_consult_alert_v1';

/**
 * A saved alert subscription: the filter criteria the user wants to watch,
 * plus the set of lot ids already seen (so we only notify on genuinely new
 * matching lots, not on every refresh).
 */
export interface AlertSubscription {
  filters: FilterState;
  seenIds: string[];
}

/** Load the persisted alert subscription, or null if none / corrupt. */
export function loadAlert(): AlertSubscription | null {
  try {
    const raw = localStorage.getItem(STORAGE_ALERT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.filters || !Array.isArray(parsed.seenIds)) {
      return null;
    }
    return parsed as AlertSubscription;
  } catch {
    return null;
  }
}

/** Persist the alert subscription. */
export function saveAlert(sub: AlertSubscription): void {
  localStorage.setItem(STORAGE_ALERT_KEY, JSON.stringify(sub));
}

/** Remove the alert subscription entirely. */
export function clearAlert(): void {
  localStorage.removeItem(STORAGE_ALERT_KEY);
}

/**
 * Given the currently-matching lots and the ids already seen, return the lots
 * that are new (their idLot is not in seenIds). Pure — does not mutate state.
 */
export function findNewMatches(matching: Article[], seenIds: string[]): Article[] {
  const seen = new Set(seenIds);
  return matching.filter((lot) => !seen.has(lot.idLot));
}

/** A short, human-readable one-line description of a lot for the toast. */
export function shortLotDescription(lot: Article): string {
  const parts = lot.articles
    .map((a) => {
      const type = a.typeIcon || TYPE_MAP[a.typeCode]?.icon || '';
      const name = `${a.marque} ${a.modele}`.trim();
      return `${type} ${name}`.trim();
    })
    .filter(Boolean);
  const label = parts.join(' + ') || lot.title || lot.idLot;
  return lot.prixVente > 0 ? `${label} — ${lot.prixVenteStr}` : label;
}

/**
 * Build a compact human summary of the watched filter for the alert badge /
 * toast header. `t` is the i18n translator, `brandOrHomologAllLabels` are the
 * already-translated "all" fallbacks handled by the caller via the filters.
 */
export function summarizeFilter(filters: FilterState, t: (key: any, params?: Record<string, string | number>) => string): string {
  const bits: string[] = [];

  if (filters.selectedType !== 'ALL') {
    const typeKeys: Record<string, string> = { '0': 'gliders', '1': 'harnesses', '2': 'reserves', '3': 'accessories' };
    const key = typeKeys[filters.selectedType];
    if (key) bits.push(t(key));
  }
  if (filters.selectedBrand !== 'ALL') bits.push(filters.selectedBrand);
  if (filters.selectedHomologation !== 'ALL') bits.push(filters.selectedHomologation);
  if (filters.selectedProfile !== 'ALL') {
    const profileKeys: Record<string, string> = {
      school: 'levelSchool', progression: 'levelProgression', performance: 'levelPerformance',
      light: 'levelLight', tandem: 'levelTandem',
    };
    const key = profileKeys[filters.selectedProfile];
    if (key) bits.push(t(key as any));
  }
  if (filters.ptvTarget) bits.push(`PTV ${filters.ptvTarget} kg`);
  if (filters.minPrice || filters.maxPrice) {
    const min = filters.minPrice || '0';
    const max = filters.maxPrice || '∞';
    bits.push(`${min}–${max} €`);
  }
  if (filters.searchQuery.trim()) bits.push(`"${filters.searchQuery.trim()}"`);

  return bits.length > 0 ? bits.join(' · ') : t('alertAllArticles');
}
