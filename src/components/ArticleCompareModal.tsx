import React from 'react';
import { X, GitCompare, Gauge, Calendar, Shield, Tag, Maximize2 } from 'lucide-react';
import { Article } from '../types';
import { TYPE_MAP } from '../utils/articleUtils';
import { useI18n } from '../i18n/I18nContext';

interface ArticleCompareModalProps {
  visible: boolean;
  onClose: () => void;
  articles: Article[];
  onRemoveFromCompare: (idLot: string) => void;
  onSelectArticle: (article: Article) => void;
  ptvTargetNum: number | null;
}

export const ArticleCompareModal: React.FC<ArticleCompareModalProps> = ({
  visible, onClose, articles, onRemoveFromCompare, onSelectArticle, ptvTargetNum,
}) => {
  const { t } = useI18n();
  if (!visible || articles.length === 0) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GitCompare size={18} color="var(--accent)" />
            <span className="modal-title">{t('compareModalTitle', { count: articles.length })}</span>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(articles.length, 4)}, 1fr)`, gap: 16 }}>
            {articles.map((item) => {
              const subItems = item.articles || [];
              const primary = item.primaryArticle || subItems[0] || { typeCode: '0', typeLabel: 'Article', typeIcon: '📦', marque: '', modele: '', homologation: '', PTVMin: 0, PTVMax: 0, taille: '', annee: '', couleurVoile: '', commentaire: '' };
              const typeConfig = TYPE_MAP[primary.typeCode] || { label: 'Article', translationKey: '', icon: '📦' };
              const glider = subItems.find((a) => a.typeCode === '0' && (a.PTVMin > 0 || a.PTVMax > 0));

              let ptvGauge: { pct: number; ptvZone: string; zoneColor: string } | null = null;
              if (ptvTargetNum !== null && glider && glider.PTVMin > 0 && glider.PTVMax > glider.PTVMin) {
                const pct = Math.max(0, Math.min(100, ((ptvTargetNum - glider.PTVMin) / (glider.PTVMax - glider.PTVMin)) * 100));
                let ptvZone = t('ptvMidZone'); let zoneColor = '#34d399';
                if (pct < 25) { ptvZone = t('ptvLowZone'); zoneColor = '#fbbf24'; }
                else if (pct > 75) { ptvZone = t('ptvHighZone'); zoneColor = '#38bdf8'; }
                ptvGauge = { pct, ptvZone, zoneColor };
              }

              return (
                <div key={item.idLot} className="card" style={{ cursor: 'pointer' }} onClick={() => onSelectArticle(item)}>
                  <div className="card-top">
                    <span className="card-lot">#{item.idLot}</span>
                    <button className="card-action-btn" onClick={(e) => { e.stopPropagation(); onRemoveFromCompare(item.idLot); }}>
                      <X size={16} color="var(--danger)" />
                    </button>
                  </div>
                  <div className="card-title-section">
                    <span className="card-type-badge"><span>{typeConfig.icon}</span> {typeConfig.translationKey ? t(typeConfig.translationKey as any) : typeConfig.label}</span>
                    <span className="card-brand">{primary.marque}</span>
                    <span className="card-model" style={{ fontSize: 15 }}>{primary.modele || item.title}</span>
                  </div>
                  <span className="card-price" style={{ fontSize: 18 }}>{item.prixVenteStr}</span>
                  <div className="card-specs">
                    {glider && (glider.PTVMin > 0 || glider.PTVMax > 0) && (
                      <span className="card-spec"><Gauge size={12} /> {glider.PTVMin}-{glider.PTVMax} kg</span>
                    )}
                    {primary.taille && <span className="card-spec"><Maximize2 size={12} /> {primary.taille}</span>}
                    {primary.annee && <span className="card-spec"><Calendar size={12} /> {primary.annee}</span>}
                    {primary.homologation && <span className="card-spec"><Shield size={12} /> {primary.homologation}</span>}
                    {primary.couleurVoile && <span className="card-spec"><Tag size={12} /> {primary.couleurVoile}</span>}
                  </div>
                  {ptvGauge && (
                    <div className="card-ptv-gauge">
                      <div className="card-ptv-track"><div className="card-ptv-fill" style={{ width: `${ptvGauge.pct}%`, backgroundColor: ptvGauge.zoneColor }} /></div>
                      <span className="card-ptv-text" style={{ color: ptvGauge.zoneColor }}>{Math.round(ptvGauge.pct)}% • {ptvGauge.ptvZone}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
