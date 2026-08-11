import React from 'react';
import { Heart, Calculator, Settings } from 'lucide-react';
import { useI18n, LanguageSelector } from '../i18n/I18nContext';
import { ThemeToggleBtn } from '../theme/ThemeContext';

interface HeaderProps {
  articleCount: number;
  filteredCount: number;
  lastUpdated: Date | null;
  isLoading: boolean;
  onRefresh: () => void;
  favoritesCount: number;
  onlyFavorites: boolean;
  onToggleFavorites: () => void;
  onOpenPtvCalc: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  articleCount,
  filteredCount,
  lastUpdated,
  isLoading,
  onRefresh,
  favoritesCount,
  onlyFavorites,
  onToggleFavorites,
  onOpenPtvCalc,
  onOpenSettings,
}) => {
  const { t } = useI18n();

  return (
    <header className="header">
      <div className="header-brand">
        <span className="header-brand-icon">🪂</span>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="header-brand-title">{t('appTitle')}</span>
            <span style={{ background: 'var(--accent)', padding: '2px 7px', borderRadius: 6, fontSize: 10, fontWeight: 800, color: '#fff' }}>
              {t('subTitleTag')}
            </span>
          </div>
          <div className="header-subtitle">
            {t('headerSubtitle', { count: filteredCount, total: articleCount })}
          </div>
        </div>
      </div>

      <div className="header-right">
        <ThemeToggleBtn />
        <LanguageSelector />

        <button className="header-btn" onClick={onOpenPtvCalc}>
          <Calculator size={17} color="var(--accent)" />
          <span>{t('ptvCalculatorBtn')}</span>
        </button>

        <button className={`header-btn ${onlyFavorites ? 'header-btn--active' : ''}`} onClick={onToggleFavorites}>
          <Heart size={17} color={onlyFavorites ? 'var(--danger)' : 'var(--text-muted)'} fill={onlyFavorites ? 'var(--danger)' : 'none'} />
          <span>{t('favoritesBtn')} ({favoritesCount})</span>
        </button>

        <button className="header-btn" onClick={onOpenSettings}>
          <Settings size={18} color="var(--text-secondary)" />
        </button>
      </div>
    </header>
  );
};
