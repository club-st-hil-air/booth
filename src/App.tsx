import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { ArticleCard } from './components/ArticleCard';
import { ArticleTable } from './components/ArticleTable';
import { ArticleDetailModal } from './components/ArticleDetailModal';
import { PTVCalculatorModal } from './components/PTVCalculatorModal';
import { SettingsModal } from './components/SettingsModal';
import { StatsBar } from './components/StatsBar';
import { ArticleCompareModal } from './components/ArticleCompareModal';
import { NewMatchesToast } from './components/NewMatchesToast';
import { AlertSetupModal } from './components/AlertSetupModal';import { Article, ArticleRaw, FilterState, SortField, SortOrder, ViewMode } from './types';
import { DEFAULT_S3_URL, PROD_S3_URL, TEST_S3_URL } from './data/mockData';
import { filterArticles, groupRawIntoLots, getSortFieldsForType, getHomologationLevel, HOMOLOGATION_SORT_ORDER, getTailleSortKey, articleForType, GROUPABLE_SORT_FIELDS, getGroupValue, formatGroupLabel } from './utils/articleUtils';
import { AlertSubscription, loadAlert, saveAlert, clearAlert, findNewMatches, summarizeFilter } from './utils/notifications';
import { AlertTriangle, GitCompare, Trash2, Bell } from 'lucide-react';
import { useI18n } from './i18n/I18nContext';
import { useTheme } from './theme/ThemeContext';

const STORAGE_FAVS_KEY = 'stand_consult_favorites_v1';
const STORAGE_API_KEY = 'stand_consult_api_url_v1';

export function App() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTestData, setIsTestData] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const isDev = import.meta.env.DEV;
  const [apiUrl, setApiUrl] = useState<string>(() => {
    if (!isDev) return PROD_S3_URL;
    const saved = localStorage.getItem(STORAGE_API_KEY);
    if (saved) return saved;
    return TEST_S3_URL;
  });
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(60);

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try { const saved = localStorage.getItem(STORAGE_FAVS_KEY); return saved ? new Set(JSON.parse(saved)) : new Set(); } catch { return new Set(); }
  });
  const [comparedIds, setComparedIds] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '', selectedStatus: 'En vente', selectedType: 'ALL', selectedBrand: 'ALL',
    selectedHomologation: 'ALL', selectedProfile: 'ALL', minPrice: '', maxPrice: '', ptvTarget: '', onlyFavorites: false,
  });

  const [sortField, setSortField] = useState<SortField>('numeroCoupon');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [ptvModalVisible, setPtvModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [compareModalVisible, setCompareModalVisible] = useState(false);

  // Alert subscription (client-side, tab-open): watch a filter and pop new matching lots.
  const [alertSub, setAlertSub] = useState<AlertSubscription | null>(() => loadAlert());
  const [newMatches, setNewMatches] = useState<Article[]>([]);
  const [viewNewIds, setViewNewIds] = useState<Set<string> | null>(null);
  const [alertSetupVisible, setAlertSetupVisible] = useState<boolean>(false);

  const handleToggleFavorite = useCallback((idLot: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(idLot)) next.delete(idLot); else next.add(idLot);
      localStorage.setItem(STORAGE_FAVS_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const handleToggleCompare = useCallback((idLot: string) => {
    setComparedIds((prev) => {
      const next = new Set(prev);
      if (next.has(idLot)) next.delete(idLot);
      else { if (next.size >= 4) { alert(t('compareMax')); return prev; } next.add(idLot); }
      return next;
    });
  }, [t]);

  const loadArticles = useCallback(async () => {
    setIsLoading(true); setErrorMsg(null); setIsTestData(false);

    const fetchJson = async (url: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      try {
        const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
        return await response.json();
      } catch (err: any) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    try {
      const data: ArticleRaw[] = await fetchJson(apiUrl);
      setArticles(groupRawIntoLots(data));
      setLastUpdated(new Date());
    } catch (primaryErr: any) {
      if (apiUrl !== TEST_S3_URL) {
        try {
          const data: ArticleRaw[] = await fetchJson(TEST_S3_URL);
          setArticles(groupRawIntoLots(data));
          setIsTestData(true);
          setLastUpdated(new Date());
        } catch {
          setArticles([]);
          setErrorMsg(primaryErr.name === 'AbortError' ? t('errorTimeout') : primaryErr.message || t('errorNetwork'));
          setLastUpdated(new Date());
        }
      } else {
        setArticles([]);
        setErrorMsg(primaryErr.name === 'AbortError' ? t('errorTimeout') : primaryErr.message || t('errorNetwork'));
        setLastUpdated(new Date());
      }
    } finally { setIsLoading(false); }
  }, [apiUrl, t]);

  useEffect(() => { loadArticles(); }, [loadArticles]);
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(loadArticles, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, loadArticles]);

  useEffect(() => {
    if (articles.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const lotParam = params.get('lot') || params.get('coupon');
    if (lotParam) {
      const found = articles.find((a) => a.idLot === lotParam || a.numeroCoupon === lotParam);
      if (found) setSelectedArticle(found);
    }
  }, [articles]);

  const handleSaveApiUrl = (url: string) => { setApiUrl(url); localStorage.setItem(STORAGE_API_KEY, url); };

  // Lots currently matching a given filter subscription (ignores the favorites toggle for alerts).
  const matchesForFilter = useCallback((list: Article[], f: FilterState): Article[] => {
    return filterArticles(list, f.searchQuery, f.selectedStatus, f.selectedType, f.selectedBrand, f.selectedHomologation, f.selectedProfile, f.minPrice, f.maxPrice, f.ptvTarget, false, favoriteIds);
  }, [favoriteIds]);

  // Toggle: turning OFF is immediate; turning ON opens the confirmation dialog.
  const handleToggleAlert = useCallback(() => {
    if (alertSub) { clearAlert(); setAlertSub(null); setNewMatches([]); return; }
    setAlertSetupVisible(true);
  }, [alertSub]);

  // Confirm from the setup dialog: snapshot the currently-matching lot ids as
  // already-seen (so the alert only fires for lots appearing AFTER activation),
  // and optionally request browser-notification permission.
  const handleConfirmAlert = useCallback((wantsBrowserNotification: boolean) => {
    const seenIds = matchesForFilter(articles, filters).map((l) => l.idLot);
    const sub: AlertSubscription = { filters: { ...filters }, seenIds };
    saveAlert(sub);
    setAlertSub(sub);
    setAlertSetupVisible(false);
    if (wantsBrowserNotification && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => { /* ignore */ });
    }
  }, [articles, filters, matchesForFilter]);

  // On every data change, if an alert is active, diff current matches against seen ids.
  useEffect(() => {
    if (!alertSub || articles.length === 0) return;
    const matching = matchesForFilter(articles, alertSub.filters);
    const fresh = findNewMatches(matching, alertSub.seenIds);
    if (fresh.length > 0) {
      setNewMatches((prev) => {
        const map = new Map(prev.map((l) => [l.idLot, l] as const));
        fresh.forEach((l) => map.set(l.idLot, l));
        return Array.from(map.values());
      });
      // Mark them seen so we don't re-notify on the next refresh.
      const updated: AlertSubscription = { ...alertSub, seenIds: matching.map((l) => l.idLot) };
      setAlertSub(updated);
      saveAlert(updated);
      // Best-effort native browser notification (only if the user already granted it).
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification(t('alertNewMatchTitle', { count: fresh.length }), { body: fresh.map((l) => `#${l.numeroCoupon} ${l.title}`).join('\n') });
        } catch { /* ignore */ }
      }
    }
  }, [articles, alertSub, matchesForFilter, t]);

  // "Consulter" — show EXACTLY the new lots from the alert: restrict the view to
  // their idLots and apply the watched filter (for consistent sort/type context).
  const handleViewNewMatches = useCallback(() => {
    const ids = new Set(newMatches.map((l) => l.idLot));
    if (alertSub) handleFilterChange(alertSub.filters);
    setViewNewIds(ids.size > 0 ? ids : null);
    setNewMatches([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertSub, newMatches]);

  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((lot) => lot.articles.forEach((a) => { if (a.marque) set.add(a.marque.toUpperCase()); }));
    return Array.from(set).sort();
  }, [articles]);

  const availableHomologations = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((lot) => lot.articles.forEach((a) => { if (a.homologation) set.add(a.homologation); }));
    return Array.from(set).sort();
  }, [articles]);

  const filteredArticles = useMemo(() => {
    let list = filterArticles(articles, filters.searchQuery, filters.selectedStatus, filters.selectedType, filters.selectedBrand, filters.selectedHomologation, filters.selectedProfile, filters.minPrice, filters.maxPrice, filters.ptvTarget, filters.onlyFavorites, favoriteIds);
    // "Consulter" mode: restrict to exactly the new lots surfaced by the alert.
    if (viewNewIds) list = list.filter((lot) => viewNewIds.has(lot.idLot));
    // When a specific type is selected, sort on that type's article within the lot
    // (a mixed lot promotes the glider as primary, which would otherwise skew size/PTV sorts).
    const artOf = (lot: Article) => articleForType(lot, filters.selectedType);
    return list.sort((a, b) => {
      let aVal: any;
      let bVal: any;
      switch (sortField) {
        case 'idLot':
        case 'numeroCoupon':
          aVal = parseInt((a as any)[sortField], 10) || 0;
          bVal = parseInt((b as any)[sortField], 10) || 0;
          break;
        case 'prixVente':
          aVal = a.prixVente; bVal = b.prixVente;
          break;
        case 'marque':
        case 'modele':
          aVal = (artOf(a)[sortField] || '').toUpperCase();
          bVal = (artOf(b)[sortField] || '').toUpperCase();
          break;
        case 'PTVMax':
          aVal = artOf(a).PTVMax || 0; bVal = artOf(b).PTVMax || 0;
          break;
        case 'annee':
          aVal = artOf(a).annee || ''; bVal = artOf(b).annee || '';
          break;
        case 'taille': {
          const ka = getTailleSortKey(artOf(a).taille);
          const kb = getTailleSortKey(artOf(b).taille);
          const dir = sortOrder === 'asc' ? 1 : -1;
          if (ka[0] !== kb[0]) return (ka[0] - kb[0]) * dir;
          if (ka[1] !== kb[1]) return (ka[1] - kb[1]) * dir;
          if (ka[2] !== kb[2]) return (ka[2] < kb[2] ? -1 : 1) * dir;
          return 0;
        }
        case 'homologation':
          aVal = HOMOLOGATION_SORT_ORDER[getHomologationLevel(artOf(a).homologation)];
          bVal = HOMOLOGATION_SORT_ORDER[getHomologationLevel(artOf(b).homologation)];
          break;
        default:
          aVal = (a as any)[sortField]; bVal = (b as any)[sortField];
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [articles, filters, favoriteIds, sortField, sortOrder, viewNewIds]);

  const ptvTargetNum = filters.ptvTarget ? parseFloat(filters.ptvTarget) : null;
  const showGroups = filteredArticles.length >= 12 && GROUPABLE_SORT_FIELDS.includes(sortField);
  const comparedArticlesList = useMemo(() => articles.filter((a) => comparedIds.has(a.idLot)), [articles, comparedIds]);

  const handleResetFilters = useCallback(() => {
    setFilters({ searchQuery: '', selectedStatus: 'ALL', selectedType: 'ALL', selectedBrand: 'ALL', selectedHomologation: 'ALL', selectedProfile: 'ALL', minPrice: '', maxPrice: '', ptvTarget: '', onlyFavorites: false });
    setSortField('numeroCoupon');
    setSortOrder('asc');
    setViewNewIds(null);
  }, []);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setViewNewIds(null);
    if (newFilters.ptvTarget && newFilters.ptvTarget.trim() !== '' && newFilters.selectedType === 'ALL') {
      newFilters = { ...newFilters, selectedType: '0' };
    }
    if (newFilters.selectedType !== filters.selectedType && !getSortFieldsForType(newFilters.selectedType).includes(sortField)) {
      setSortField('numeroCoupon');
      setSortOrder('asc');
    }
    setFilters(newFilters);
  }, [filters.selectedType, sortField]);

  const handleSortChange = useCallback((field: SortField, order: SortOrder) => { setSortField(field); setSortOrder(order); }, []);
  const handleToggleFavoritesFilter = useCallback(() => { setFilters((f) => ({ ...f, onlyFavorites: !f.onlyFavorites })); }, []);
  const handleOpenPtvCalc = useCallback(() => setPtvModalVisible(true), []);
  const handleOpenSettings = useCallback(() => setSettingsModalVisible(true), []);
  const handleSelectArticle = useCallback((article: Article) => setSelectedArticle(article), []);

  return (
    <div className="app">
      <Header
        articleCount={articles.length} filteredCount={filteredArticles.length} lastUpdated={lastUpdated} isLoading={isLoading}
        onRefresh={loadArticles} favoritesCount={favoriteIds.size} onlyFavorites={filters.onlyFavorites}
        onToggleFavorites={handleToggleFavoritesFilter} onOpenPtvCalc={handleOpenPtvCalc} onOpenSettings={handleOpenSettings}
      />

      <FilterBar
        filters={filters} onFilterChange={handleFilterChange} sortField={sortField} sortOrder={sortOrder}
        onSortChange={handleSortChange} viewMode={viewMode} onViewModeChange={setViewMode}
        brands={availableBrands} homologations={availableHomologations} onResetFilters={handleResetFilters}
        alertActive={Boolean(alertSub)} onToggleAlert={handleToggleAlert}
      />

      {viewNewIds && (
        <div className="new-lots-banner">
          <Bell size={16} color="var(--accent)" />
          <span className="new-lots-banner-text">{t('viewingNewLots', { count: viewNewIds.size })}</span>
          <button className="new-lots-banner-btn" onClick={() => setViewNewIds(null)}>{t('showAllLots')}</button>
        </div>
      )}

      {isTestData && (
        <div className="test-data-banner">
          <AlertTriangle size={16} />
          <span className="test-data-banner-text">{t('offlineModeBanner')}</span>
        </div>
      )}

      {errorMsg && (
        <div className="error-banner">
          <AlertTriangle size={16} color="var(--danger)" />
          <span className="error-banner-text">{errorMsg}</span>
          <button className="error-banner-btn" onClick={loadArticles}>{t('retry')}</button>
        </div>
      )}

      <main className="main-scroll">
        {isLoading && articles.length === 0 ? (
          <div className="loading"><div className="spinner" /><span className="loading-text">{t('refreshing')}</span></div>
        ) : filteredArticles.length === 0 ? (
          <div className="empty-state">
            <span className="empty-emoji">🔍</span>
            <span className="empty-title">{t('emptyTitle')}</span>
            <span className="empty-sub">{t('emptySub')}</span>
            <button className="empty-btn" onClick={handleResetFilters}>{t('resetFilters')}</button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid">
            {(() => {
              const els: React.ReactNode[] = [];
              let lastGroup: string | null = null;
              filteredArticles.forEach((item) => {
                if (showGroups) {
                  const g = getGroupValue(item, sortField, filters.selectedType) ?? '';
                  if (g !== lastGroup) {
                    lastGroup = g;
                    els.push(
                      <div className="grid-separator" key={`sep-${item.idLot}`}>{formatGroupLabel(sortField, g, t)}</div>
                    );
                  }
                }
                els.push(
                  <ArticleCard
                    key={item.idLot}
                    article={item}
                    isFavorite={favoriteIds.has(item.idLot)}
                    onToggleFavorite={handleToggleFavorite}
                    isCompared={comparedIds.has(item.idLot)}
                    onToggleCompare={handleToggleCompare}
                    onPress={handleSelectArticle}
                    ptvTargetNum={ptvTargetNum}
                  />
                );
              });
              return els;
            })()}
          </div>
        ) : (
          <ArticleTable
            articles={filteredArticles} favoriteIds={favoriteIds} onToggleFavorite={handleToggleFavorite}
            onSelectArticle={handleSelectArticle} sortField={sortField} sortOrder={sortOrder}
            onSortChange={handleSortChange} ptvTargetNum={ptvTargetNum}
            selectedType={filters.selectedType} showGroups={showGroups}
          />
        )}
      </main>

      {comparedIds.size > 0 && (
        <div className="compare-bar">
          <div className="compare-bar-left">
            <GitCompare size={18} color="var(--accent)" />
            <span className="compare-bar-title">{t('compareBarTitle', { count: comparedIds.size })}</span>
          </div>
          <div className="compare-bar-right">
            <button className="modal-btn modal-btn--danger" onClick={() => setComparedIds(new Set())}>
              <Trash2 size={15} /> {t('clearCompare')}
            </button>
            <button className="modal-btn modal-btn--primary" onClick={() => setCompareModalVisible(true)}>
              <GitCompare size={15} /> {t('compareBtn')}
            </button>
          </div>
        </div>
      )}

      <StatsBar articles={articles} filteredCount={filteredArticles.length} />

      <ArticleDetailModal
        article={selectedArticle}
        visible={Boolean(selectedArticle)}
        onClose={() => setSelectedArticle(null)}
        isFavorite={selectedArticle ? favoriteIds.has(selectedArticle.idLot) : false}
        onToggleFavorite={handleToggleFavorite}
        ptvTargetNum={ptvTargetNum}
        currentIndex={selectedArticle ? filteredArticles.findIndex(a => a.idLot === selectedArticle.idLot) : 0}
        totalCount={filteredArticles.length}
        onPrev={() => {
          const idx = filteredArticles.findIndex(a => a.idLot === selectedArticle?.idLot);
          if (idx > 0) setSelectedArticle(filteredArticles[idx - 1]);
        }}
        onNext={() => {
          const idx = filteredArticles.findIndex(a => a.idLot === selectedArticle?.idLot);
          if (idx < filteredArticles.length - 1) setSelectedArticle(filteredArticles[idx + 1]);
        }}
      />
      <ArticleCompareModal visible={compareModalVisible} onClose={() => setCompareModalVisible(false)} articles={comparedArticlesList} onRemoveFromCompare={handleToggleCompare} onSelectArticle={handleSelectArticle} ptvTargetNum={ptvTargetNum} />
      <PTVCalculatorModal visible={ptvModalVisible} onClose={() => setPtvModalVisible(false)} currentPtv={filters.ptvTarget} onApplyPtv={(val) => handleFilterChange({ ...filters, ptvTarget: val })} />
      <SettingsModal visible={settingsModalVisible} onClose={() => setSettingsModalVisible(false)} apiUrl={apiUrl} onSaveApiUrl={handleSaveApiUrl} autoRefreshInterval={autoRefreshInterval} onSaveAutoRefresh={setAutoRefreshInterval} />

      <AlertSetupModal
        visible={alertSetupVisible}
        filterSummary={summarizeFilter(filters, t)}
        canRequestNotification={typeof Notification !== 'undefined' && Notification.permission !== 'denied'}
        onConfirm={handleConfirmAlert}
        onCancel={() => setAlertSetupVisible(false)}
      />

      {alertSub && (
        <NewMatchesToast
          matches={newMatches}
          filterSummary={summarizeFilter(alertSub.filters, t)}
          onView={handleViewNewMatches}
          onDismiss={() => setNewMatches([])}
        />
      )}
    </div>
  );
}
