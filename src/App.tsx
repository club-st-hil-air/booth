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
import { Article, ArticleRaw, FilterState, SortField, SortOrder, ViewMode } from './types';
import { DEFAULT_S3_URL, PROD_S3_URL, TEST_S3_URL } from './data/mockData';
import { filterArticles, groupRawIntoLots } from './utils/articleUtils';
import { AlertTriangle, GitCompare, Trash2 } from 'lucide-react';
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
    if (saved && saved !== PROD_S3_URL) return saved;
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

  const [sortField, setSortField] = useState<SortField>('idLot');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [ptvModalVisible, setPtvModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [compareModalVisible, setCompareModalVisible] = useState(false);

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
      else { if (next.size >= 4) { alert('Max 4 lots pour la comparaison.'); return prev; } next.add(idLot); }
      return next;
    });
  }, []);

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
          setErrorMsg(primaryErr.name === 'AbortError' ? 'Timeout réseau (3.5s).' : primaryErr.message || 'Erreur réseau.');
          setLastUpdated(new Date());
        }
      } else {
        setArticles([]);
        setErrorMsg(primaryErr.name === 'AbortError' ? 'Timeout réseau (3.5s).' : primaryErr.message || 'Erreur réseau.');
        setLastUpdated(new Date());
      }
    } finally { setIsLoading(false); }
  }, [apiUrl]);

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
    const list = filterArticles(articles, filters.searchQuery, filters.selectedStatus, filters.selectedType, filters.selectedBrand, filters.selectedHomologation, filters.selectedProfile, filters.minPrice, filters.maxPrice, filters.ptvTarget, filters.onlyFavorites, favoriteIds);
    return list.sort((a, b) => {
      let aVal: any = (a as any)[sortField];
      let bVal: any = (b as any)[sortField];
      if (sortField === 'marque' || sortField === 'modele') { aVal = a.primaryArticle[sortField] || ''; bVal = b.primaryArticle[sortField] || ''; }
      else if (sortField === 'PTVMax') { aVal = a.primaryArticle.PTVMax || 0; bVal = b.primaryArticle.PTVMax || 0; }
      else if (sortField === 'annee') { aVal = a.primaryArticle.annee || ''; bVal = b.primaryArticle.annee || ''; }
      if (sortField === 'idLot' || sortField === 'numeroCoupon') { aVal = parseInt(aVal, 10) || 0; bVal = parseInt(bVal, 10) || 0; }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [articles, filters, favoriteIds, sortField, sortOrder]);

  const ptvTargetNum = filters.ptvTarget ? parseFloat(filters.ptvTarget) : null;
  const comparedArticlesList = useMemo(() => articles.filter((a) => comparedIds.has(a.idLot)), [articles, comparedIds]);

  const handleResetFilters = useCallback(() => {
    setFilters({ searchQuery: '', selectedStatus: 'ALL', selectedType: 'ALL', selectedBrand: 'ALL', selectedHomologation: 'ALL', selectedProfile: 'ALL', minPrice: '', maxPrice: '', ptvTarget: '', onlyFavorites: false });
  }, []);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    if (newFilters.ptvTarget && newFilters.ptvTarget.trim() !== '' && newFilters.selectedType === 'ALL') {
      newFilters = { ...newFilters, selectedType: '0' };
    }
    setFilters(newFilters);
  }, []);

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
      />

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
          <button className="error-banner-btn" onClick={loadArticles}>Réessayer</button>
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
            {filteredArticles.map((item) => (
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
            ))}
          </div>
        ) : (
          <ArticleTable
            articles={filteredArticles} favoriteIds={favoriteIds} onToggleFavorite={handleToggleFavorite}
            onSelectArticle={handleSelectArticle} sortField={sortField} sortOrder={sortOrder}
            onSortChange={handleSortChange} ptvTargetNum={ptvTargetNum}
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
    </div>
  );
}
