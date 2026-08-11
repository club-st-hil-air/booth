import React from 'react';
import { Article } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface StatsBarProps {
  articles: Article[];
  filteredCount: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({ articles }) => {
  const { t } = useI18n();
  const total = articles.length;
  const enVenteCount = articles.filter((a) => a.statut.includes('En vente')).length;
  const voilesCount = articles.filter((a) => (a as any).typeCode === '0').length;
  const sellettesCount = articles.filter((a) => (a as any).typeCode === '1').length;
  const secoursCount = articles.filter((a) => (a as any).typeCode === '2').length;
  const accessoiresCount = articles.filter((a) => (a as any).typeCode === '3').length;

  const prices = articles.map((a) => a.prixVente).filter((p) => p > 0);
  const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  return (
    <div className="stats-bar">
      <div className="stats-item"><span className="stats-label">{t('totalLots')}</span><span className="stats-value">{total}</span></div>
      <div className="stats-item"><span className="stats-label">{t('inSale')}</span><span className="stats-value">{enVenteCount}</span></div>
      <div className="stats-item"><span className="stats-label">{t('glidersCount')}</span><span className="stats-value">{voilesCount}</span></div>
      <div className="stats-item"><span className="stats-label">{t('harnessesCount')}</span><span className="stats-value">{sellettesCount}</span></div>
      <div className="stats-item"><span className="stats-label">{t('reservesCount')}</span><span className="stats-value">{secoursCount}</span></div>
      <div className="stats-item"><span className="stats-label">{t('accessoriesCount')}</span><span className="stats-value">{accessoiresCount}</span></div>
      <div className="stats-item"><span className="stats-label">{t('avgPrice')}</span><span className="stats-value">{avgPrice} €</span></div>
      <div className="stats-item"><span className="stats-label">{t('priceRange')}</span><span className="stats-value">{minPrice} - {maxPrice} €</span></div>
    </div>
  );
};
