import React, { useState } from 'react';
import { Search, X, SlidersHorizontal, LayoutGrid, List, RotateCcw } from 'lucide-react';
import { FilterState, SortField, SortOrder, ViewMode } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField, order: SortOrder) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  brands: string[];
  homologations: string[];
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters, onFilterChange, sortField, sortOrder, onSortChange, viewMode, onViewModeChange, brands, homologations, onResetFilters,
}) => {
  const { t } = useI18n();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const categories = [
    { code: 'ALL', label: t('allCategories'), icon: '✨' },
    { code: '0', label: t('gliders'), icon: '🪂' },
    { code: '1', label: t('harnesses'), icon: '💺' },
    { code: '2', label: t('reserves'), icon: '🆘' },
    { code: '3', label: t('accessories'), icon: '🛠' },
  ];

  const profiles = [
    { code: 'ALL', label: t('allLevels') },
    { code: 'school', label: t('levelSchool') },
    { code: 'progression', label: t('levelProgression') },
    { code: 'performance', label: t('levelPerformance') },
    { code: 'light', label: t('levelLight') },
    { code: 'tandem', label: t('levelTandem') },
  ];

  const sortOptions: { field: SortField; key: string }[] = [
    { field: 'idLot', key: 'sortLot' },
    { field: 'prixVente', key: 'sortPrice' },
    { field: 'marque', key: 'sortBrand' },
    { field: 'PTVMax', key: 'sortPtv' },
    { field: 'annee', key: 'sortYear' },
  ];

  const activeAdvancedCount = [
    filters.selectedProfile !== 'ALL',
    filters.selectedBrand !== 'ALL',
    filters.selectedHomologation !== 'ALL',
    Boolean(filters.minPrice),
    Boolean(filters.maxPrice),
    Boolean(filters.ptvTarget),
  ].filter(Boolean).length;

  return (
    <div className={`filterbar ${showAdvanced ? 'filterbar--expanded' : ''}`}>
      {/* Row 1: Search + view toggle + advanced button */}
      <div className="filterbar-row">
        <div className="filterbar-search-wrap">
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="filterbar-search"
            placeholder={t('searchPlaceholder')}
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
          />
          {filters.searchQuery.length > 0 && (
            <button className="filterbar-search-clear" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }} onClick={() => onFilterChange({ ...filters, searchQuery: '' })}>
              <X size={16} />
            </button>
          )}
        </div>

        <button className={`view-btn ${viewMode === 'grid' ? 'view-btn--active' : ''}`} onClick={() => onViewModeChange('grid')}>
          <LayoutGrid size={17} />
        </button>
        <button className={`view-btn ${viewMode === 'table' ? 'view-btn--active' : ''}`} onClick={() => onViewModeChange('table')}>
          <List size={17} />
        </button>

        <button className={`header-btn ${showAdvanced || activeAdvancedCount > 0 ? 'header-btn--active' : ''}`} onClick={() => setShowAdvanced(!showAdvanced)}>
          <SlidersHorizontal size={16} />
          <span>{t('filtersBtn')}</span>
          {activeAdvancedCount > 0 && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 800 }}>{activeAdvancedCount}</span>}
        </button>
      </div>

      {/* Row 2: Type category pills (labeled) */}
      <div className="filterbar-row filterbar-row--collapsible">
        <span className="filter-group-label">Type</span>
        {categories.map((cat) => (
          <button key={cat.code} className={`pill ${filters.selectedType === cat.code ? 'pill--active' : ''}`} onClick={() => onFilterChange({ ...filters, selectedType: cat.code })}>
            <span>{cat.icon}</span><span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Row 3: Sort */}
      <div className="filterbar-row filterbar-row--collapsible">
        <span className="filter-group-label">{t('sortBy')}</span>
        {sortOptions.map((opt) => {
          const isSelected = sortField === opt.field;
          return (
            <button
              key={opt.field}
              className={`sort-btn ${isSelected ? 'sort-btn--active' : ''}`}
              onClick={() => isSelected ? onSortChange(opt.field, sortOrder === 'asc' ? 'desc' : 'asc') : onSortChange(opt.field, 'asc')}
            >
              {t(opt.key as any)} {isSelected ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
            </button>
          );
        })}
      </div>

      {/* Advanced panel (profiles, brand, homologation, price, PTV) */}
      {showAdvanced && (
        <div className="filterbar-advanced">
          {/* Profiles row */}
          <div className="filterbar-row">
            <span className="filter-group-label">Niveau</span>
            {profiles.map((pf) => (
              <button key={pf.code} className={`pill ${filters.selectedProfile === pf.code ? 'pill--active' : ''}`} onClick={() => onFilterChange({ ...filters, selectedProfile: pf.code })}>
                {pf.label}
              </button>
            ))}
          </div>

          {/* Advanced filters grid */}
          <div className="filterbar-advanced-grid">
            <div>
              <label className="form-label">{t('pilotPtvLabel')}</label>
              <input className="form-input" placeholder="Ex: 85" type="number" value={filters.ptvTarget} onChange={(e) => onFilterChange({ ...filters, ptvTarget: e.target.value })} />
            </div>
            <div>
              <label className="form-label">{t('brandLabel')}</label>
              <select className="filterbar-select" value={filters.selectedBrand} onChange={(e) => onFilterChange({ ...filters, selectedBrand: e.target.value })}>
                <option value="ALL">{t('allBrands')}</option>
                {brands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">{t('homologationLabel')}</label>
              <select className="filterbar-select" value={filters.selectedHomologation} onChange={(e) => onFilterChange({ ...filters, selectedHomologation: e.target.value })}>
                <option value="ALL">{t('allHomologations')}</option>
                {homologations.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">{t('priceLabel')}</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input className="form-input" placeholder="Min €" type="number" value={filters.minPrice} onChange={(e) => onFilterChange({ ...filters, minPrice: e.target.value })} style={{ flex: 1 }} />
                <span style={{ color: 'var(--text-muted)' }}>—</span>
                <input className="form-input" placeholder="Max €" type="number" value={filters.maxPrice} onChange={(e) => onFilterChange({ ...filters, maxPrice: e.target.value })} style={{ flex: 1 }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="modal-btn modal-btn--danger" onClick={onResetFilters} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RotateCcw size={14} /> {t('resetFilters')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
