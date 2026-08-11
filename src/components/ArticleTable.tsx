import React from 'react';
import { Heart, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { Article, SortField, SortOrder } from '../types';
import { TYPE_MAP } from '../utils/articleUtils';
import { useI18n } from '../i18n/I18nContext';

interface ArticleTableProps {
  articles: Article[];
  favoriteIds: Set<string>;
  onToggleFavorite: (idLot: string) => void;
  onSelectArticle: (article: Article) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField, order: SortOrder) => void;
  ptvTargetNum: number | null;
}

const ArticleTableComponent: React.FC<ArticleTableProps> = ({
  articles, favoriteIds, onToggleFavorite, onSelectArticle, sortField, sortOrder, onSortChange,
}) => {
  const { t } = useI18n();

  const handleHeaderClick = (field: SortField) => {
    if (sortField === field) onSortChange(field, sortOrder === 'asc' ? 'desc' : 'asc');
    else onSortChange(field, 'asc');
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={12} color="var(--text-muted)" />;
    return sortOrder === 'asc' ? <ChevronUp size={14} color="var(--accent)" /> : <ChevronDown size={14} color="var(--accent)" />;
  };

  const columns: { field: SortField | null; label: string; width: string }[] = [
    { field: 'idLot', label: 'Lot', width: '70px' },
    { field: null, label: 'Type', width: '100px' },
    { field: 'marque', label: t('sortBrand'), width: '120px' },
    { field: 'prixVente', label: t('sortPrice'), width: '100px' },
    { field: 'PTVMax', label: 'PTV', width: '100px' },
    { field: 'annee', label: t('sortYear'), width: '80px' },
    { field: null, label: '♥', width: '50px' },
  ];

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} onClick={col.field ? () => handleHeaderClick(col.field!) : undefined} style={{ width: col.width, cursor: col.field ? 'pointer' : 'default' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {col.label} {col.field && <SortIcon field={col.field} />}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => {
            const primary = article.primaryArticle;
            const typeConfig = TYPE_MAP[primary.typeCode] || { icon: '📦', label: 'Article' };
            const isFav = favoriteIds.has(article.idLot);
            return (
              <tr key={article.idLot} onClick={() => onSelectArticle(article)}>
                <td><strong style={{ color: 'var(--accent)' }}>#{article.idLot}</strong></td>
                <td><span>{typeConfig.icon} {typeConfig.translationKey ? t(typeConfig.translationKey as any) : typeConfig.label}</span></td>
                <td>{primary.marque} {primary.modele}</td>
                <td><strong style={{ color: 'var(--success)' }}>{article.prixVenteStr}</strong></td>
                <td>{primary.PTVMax > 0 ? `${primary.PTVMin}-${primary.PTVMax} kg` : '-'}</td>
                <td>{primary.annee || '-'}</td>
                <td>
                  <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(article.idLot); }} style={{ padding: 4 }}>
                    <Heart size={16} color={isFav ? 'var(--danger)' : 'var(--text-muted)'} fill={isFav ? 'var(--danger)' : 'none'} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export const ArticleTable = React.memo(ArticleTableComponent);
