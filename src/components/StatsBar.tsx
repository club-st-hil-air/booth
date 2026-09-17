import React from 'react';
import { Article } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface StatsBarProps {
  articles: Article[];
  filteredCount: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({ articles }) => {
  const { t } = useI18n();
  const lotsCount = articles.length;
  const allItems = articles.flatMap((a) => a.articles || []);
  const voilesCount = allItems.filter((i) => i.typeCode === '0').length;
  const sellettesCount = allItems.filter((i) => i.typeCode === '1').length;
  const secoursCount = allItems.filter((i) => i.typeCode === '2').length;
  const accessoiresCount = allItems.filter((i) => i.typeCode === '3').length;

  return (
    <div className="stats-bar">
      <div className="stats-item"><span className="stats-label">{t('totalLotsCount')}</span><span className="stats-value">{lotsCount}</span></div>
      <div className="stats-item"><span className="stats-label">{t('glidersCount')}</span><span className="stats-value">{voilesCount}</span></div>
      <div className="stats-item"><span className="stats-label">{t('harnessesCount')}</span><span className="stats-value">{sellettesCount}</span></div>
      <div className="stats-item"><span className="stats-label">{t('reservesCount')}</span><span className="stats-value">{secoursCount}</span></div>
      <div className="stats-item"><span className="stats-label">{t('accessoriesCount')}</span><span className="stats-value">{accessoiresCount}</span></div>
    </div>
  );
};
