import React from 'react';
import { Heart, Tag, Calendar, Shield, Gauge, Maximize2, FileText, GitCompare } from 'lucide-react';
import { Article } from '../types';
import { TYPE_MAP, getHomologationLevel, HOMOLOGATION_COLORS } from '../utils/articleUtils';
import { useI18n } from '../i18n/I18nContext';

interface ArticleCardProps {
  article: Article;
  isFavorite: boolean;
  onToggleFavorite: (idLot: string) => void;
  isCompared: boolean;
  onToggleCompare: (idLot: string) => void;
  onPress: (article: Article) => void;
  ptvTargetNum: number | null;
}

const ArticleCardComponent: React.FC<ArticleCardProps> = ({
  article, isFavorite, onToggleFavorite, isCompared, onToggleCompare, onPress, ptvTargetNum,
}) => {
  const { t } = useI18n();
  const items = article.articles || [];
  const primary = article.primaryArticle || items[0] || {
    typeCode: '0', typeLabel: 'Article', typeIcon: '📦', marque: '', modele: '',
    homologation: '', PTVMin: 0, PTVMax: 0, taille: '', annee: '', couleurVoile: '', commentaire: '',
  };

  const typeConfig = TYPE_MAP[primary.typeCode] || { label: 'Article', translationKey: '', icon: '📦' };

  let isPtvMatch = false;
  const gliderItem = items.find((a) => a.typeCode === '0' && (a.PTVMin > 0 || a.PTVMax > 0));
  if (ptvTargetNum !== null && gliderItem) {
    const min = gliderItem.PTVMin > 0 ? gliderItem.PTVMin : 0;
    const max = gliderItem.PTVMax > 0 ? gliderItem.PTVMax : 999;
    if (ptvTargetNum >= min && ptvTargetNum <= max) isPtvMatch = true;
  }

  let ptvGauge: { pct: number; ptvZone: string; zoneColor: string } | null = null;
  if (ptvTargetNum !== null && gliderItem && gliderItem.PTVMin > 0 && gliderItem.PTVMax > gliderItem.PTVMin) {
    const pct = Math.max(0, Math.min(100, ((ptvTargetNum - gliderItem.PTVMin) / (gliderItem.PTVMax - gliderItem.PTVMin)) * 100));
    let ptvZone = t('ptvMidZone');
    let zoneColor = '#34d399';
    if (pct < 25) { ptvZone = t('ptvLowZone'); zoneColor = '#fbbf24'; }
    else if (pct > 75) { ptvZone = t('ptvHighZone'); zoneColor = '#38bdf8'; }
    ptvGauge = { pct, ptvZone, zoneColor };
  }

  return (
    <div className={`card ${isPtvMatch ? 'card--ptv-match' : ''}`} onClick={() => onPress(article)}>
      {/* Top: Lot badge + type on left, Price + actions on right */}
      <div className="card-top">
        <div className="card-top-left">
          <div className="card-lot">{t('lotNum')} #{article.numeroCoupon}</div>
          <span className="card-type-badge">
            <span className="card-type-icon">{items.length > 1 ? '📦' : typeConfig.icon}</span>
            {items.length > 1 ? t('articlesCount', { count: items.length }) : (typeConfig.translationKey ? t(typeConfig.translationKey as any) : typeConfig.label)}
          </span>
        </div>
        <div className="card-top-right">
          <span className="card-price">{article.prixVenteStr}</span>
          <button
            className={`card-action-btn ${isCompared ? 'card-action-btn--active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggleCompare(article.idLot); }}
          >
            <GitCompare size={16} color={isCompared ? 'var(--accent)' : 'var(--text-muted)'} />
          </button>
          <button className="card-action-btn" onClick={(e) => { e.stopPropagation(); onToggleFavorite(article.idLot); }}>
            <Heart size={18} color={isFavorite ? 'var(--danger)' : 'var(--text-muted)'} fill={isFavorite ? 'var(--danger)' : 'none'} />
          </button>
        </div>
      </div>

      {/* Brand & Model */}
      <div className="card-title-section">
        <span className="card-brand">{primary.marque || t('noBrand')}</span>
        <span className="card-model">{article.title || t('noModel')}</span>
      </div>

      {/* Multi-article breakdown */}
      {items.length > 1 && (
        <div className="card-multi-articles">
          {items.map((item, idx) => (
            <div key={idx} className="card-multi-chip">
              <span className="card-multi-icon">{item.typeIcon}</span>
              <span>{TYPE_MAP[item.typeCode]?.translationKey ? t(TYPE_MAP[item.typeCode].translationKey as any) : item.typeLabel} {item.marque} {item.modele}</span>
            </div>
          ))}
        </div>
      )}

      {/* Specs */}
      <div className="card-specs">
        {gliderItem && (gliderItem.PTVMin > 0 || gliderItem.PTVMax > 0) && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className={`card-spec ${isPtvMatch ? 'card-spec--ptv-match' : ''}`}>
              <Gauge size={13} color={isPtvMatch ? '#38bdf8' : 'var(--text-muted)'} />
              {t('ptvRange', { min: gliderItem.PTVMin > 0 ? gliderItem.PTVMin : '?', max: gliderItem.PTVMax > 0 ? gliderItem.PTVMax : '?' })}
            </span>
            {ptvGauge && (
              <div className="card-ptv-gauge">
                <div className="card-ptv-track">
                  <div className="card-ptv-fill" style={{ width: `${ptvGauge.pct}%`, backgroundColor: ptvGauge.zoneColor }} />
                </div>
                <span className="card-ptv-text" style={{ color: ptvGauge.zoneColor }}>
                  {Math.round(ptvGauge.pct)}% • {ptvGauge.ptvZone}
                </span>
              </div>
            )}
          </div>
        )}
        {primary.taille !== '' && (
          <span className="card-spec"><Maximize2 size={13} color="var(--text-muted)" />{t('sizeLabel')} {primary.taille}</span>
        )}
        {primary.annee !== '' && (
          <span className="card-spec"><Calendar size={13} color="var(--text-muted)" />{primary.annee}</span>
        )}
        {primary.homologation !== '' && (() => {
          const level = getHomologationLevel(primary.homologation);
          return (
            <span className={`card-spec ${level ? `card-spec--homol-${level}` : ''}`}>
              <Shield size={13} color={HOMOLOGATION_COLORS[level]} />{primary.homologation}
            </span>
          );
        })()}
        {primary.couleurVoile !== '' && (
          <span className="card-spec"><Tag size={13} color="var(--text-muted)" />{primary.couleurVoile}</span>
        )}
      </div>

      {/* Comment */}
      {primary.commentaire !== '' && (
        <div className="card-comment">
          <FileText size={12} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
          <span className="card-comment-text">{primary.commentaire}</span>
        </div>
      )}
    </div>
  );
};

export const ArticleCard = React.memo(ArticleCardComponent);
