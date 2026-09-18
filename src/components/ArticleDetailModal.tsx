import React, { useState } from 'react';
import { X, Heart, Gauge, Calendar, Shield, Tag, Maximize2, FileText, Copy, Check, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Article } from '../types';
import { TYPE_MAP, getHomologationLevel, HOMOLOGATION_COLORS } from '../utils/articleUtils';
import { ColorPalette } from './ColorPalette';
import { useI18n } from '../i18n/I18nContext';
import { Language } from '../i18n/translations';

function getItemSearchKeywords(typeCode: string, lang: Language): string {
  if (lang === 'fr') {
    if (typeCode === '0') return 'parapente essai test';
    if (typeCode === '1') return 'sellette parapente test avis';
    if (typeCode === '2') return 'parachute secours parapente';
    return 'parapente';
  }
  if (lang === 'de') {
    if (typeCode === '0') return 'gleitschirm testbericht test';
    if (typeCode === '1') return 'gleitschirm gurtzeug test';
    if (typeCode === '2') return 'gleitschirm rettung';
    return 'gleitschirm';
  }
  if (lang === 'es') {
    if (typeCode === '0') return 'parapente prueba opinion';
    if (typeCode === '1') return 'silla parapente prueba';
    if (typeCode === '2') return 'paracaidas emergencia parapente';
    return 'parapente';
  }
  if (typeCode === '0') return 'paraglider review test';
  if (typeCode === '1') return 'paragliding harness review';
  if (typeCode === '2') return 'paragliding reserve parachute';
  return 'paragliding';
}

interface ArticleDetailModalProps {
  article: Article | null;
  visible: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (idLot: string) => void;
  ptvTargetNum: number | null;
  onNext: () => void;
  onPrev: () => void;
  currentIndex: number;
  totalCount: number;
}

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({
  article, visible, onClose, isFavorite, onToggleFavorite, ptvTargetNum, onNext, onPrev, currentIndex, totalCount,
}) => {
  const { t, lang } = useI18n();
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (!visible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, onPrev, onNext, onClose]);

  if (!visible || !article) return null;

  const items = article.articles || [];
  const primary = article.primaryArticle || items[0] || { typeCode: '0', typeLabel: 'Article', typeIcon: '📦', marque: '', modele: '', homologation: '', PTVMin: 0, PTVMax: 0, taille: '', annee: '', couleurVoile: '', commentaire: '' };
  const typeConfig = TYPE_MAP[primary.typeCode] || { label: 'Article', translationKey: '', icon: '📦' };
  const glider = items.find((a) => a.typeCode === '0' && (a.PTVMin > 0 || a.PTVMax > 0));

  let isPtvMatch = false;
  if (ptvTargetNum !== null && glider) {
    const min = glider.PTVMin > 0 ? glider.PTVMin : 0;
    const max = glider.PTVMax > 0 ? glider.PTVMax : 999;
    if (ptvTargetNum >= min && ptvTargetNum <= max) isPtvMatch = true;
  }

  const handleCopy = () => {
    const text = `Lot #${article.numeroCoupon}: ${article.title || `${primary.marque} ${primary.modele}`} - ${article.prixVenteStr}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="modal-btn modal-btn--secondary" onClick={onPrev} disabled={currentIndex <= 0} style={{ opacity: currentIndex <= 0 ? 0.3 : 1, padding: '6px 8px' }}>
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 50, textAlign: 'center' }}>{currentIndex + 1} / {totalCount}</span>
            <button className="modal-btn modal-btn--secondary" onClick={onNext} disabled={currentIndex >= totalCount - 1} style={{ opacity: currentIndex >= totalCount - 1 ? 0.3 : 1, padding: '6px 8px' }}>
              <ChevronRight size={18} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ background: 'var(--accent)', color: '#fff', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 800 }}>
              {t('lotNum')} #{article.numeroCoupon}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="card-action-btn" onClick={() => onToggleFavorite(article.idLot)}>
              <Heart size={18} color={isFavorite ? 'var(--danger)' : 'var(--text-muted)'} fill={isFavorite ? 'var(--danger)' : 'none'} />
            </button>
            <button className="modal-close" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Hero */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="card-type-badge">{items.length > 1 ? '📦' : typeConfig.icon} {items.length > 1 ? t('articlesCount', { count: items.length }) : (typeConfig.translationKey ? t(typeConfig.translationKey as any) : typeConfig.label)}</span>
              </div>
              <span className="card-price">{article.prixVenteStr}</span>
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
              {items.some((it) => it.marque || it.modele)
                ? items
                    .filter((it) => (it.marque || it.modele))
                    .map((it, i) => (
                      <span key={i} className="card-model-item">
                        {i > 0 && <span className="card-model-sep"> + </span>}
                        {it.marque && <span className="card-model-brand">{it.marque} </span>}
                        <span className="card-model-name">{it.modele}</span>
                      </span>
                    ))
                : (article.title || primary.modele || t('noModel'))}
            </span>
          </div>

          {/* Articles in Lot */}
          <div className="detail-section">
            <span className="detail-section-title">{t('techSpecs')}{items.length > 1 ? ` (${items.length})` : ''}</span>
            {items.map((item, idx) => {
              const keywords = getItemSearchKeywords(item.typeCode, lang);
              const searchLabel = `${item.marque} ${item.modele}`.trim() || item.typeLabel;
              // Single-article lots: the hero already shows type/brand/model, so
              // drop the per-item header and the surrounding box to avoid duplication.
              const single = items.length === 1;
              const wrapperStyle: React.CSSProperties = single
                ? { display: 'flex', flexDirection: 'column', gap: 8 }
                : { background: 'var(--bg-section)', borderRadius: 10, padding: 12, border: '1px solid var(--border-main)', display: 'flex', flexDirection: 'column', gap: 8 };
              return (
                <div key={idx} style={wrapperStyle}>
                  {!single && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{item.typeIcon}</span>
                      <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>{TYPE_MAP[item.typeCode]?.translationKey ? t(TYPE_MAP[item.typeCode].translationKey as any) : item.typeLabel}: {`${item.marque} ${item.modele}`.trim()}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {item.homologation && (() => {
                      const level = getHomologationLevel(item.homologation);
                      return (
                        <div className="detail-row">
                          <Shield size={14} className="detail-row-icon" color={HOMOLOGATION_COLORS[level]} />
                          <span className="detail-row-label">{t('homologationLabel')}</span>
                          <span className="detail-row-value">
                            <span className={`card-spec ${level ? `card-spec--homol-${level}` : ''}`}>
                              {item.homologation}
                            </span>
                          </span>
                        </div>
                      );
                    })()}
                    {/* Glider PTV: full gauge + weight-position analysis, right under homologation. */}
                    {item === glider && (item.PTVMin > 0 || item.PTVMax > 0) && (
                      <div className={`ptv-gauge ${isPtvMatch ? 'ptv-gauge--match' : ''}`}>
                        <div className="ptv-header">
                          <Gauge size={18} color={isPtvMatch ? 'var(--state-good)' : 'var(--text-muted)'} />
                          <span className="ptv-label">{t('ptvRange', { min: item.PTVMin > 0 ? item.PTVMin : '?', max: item.PTVMax > 0 ? item.PTVMax : '?' })}</span>
                        </div>
                        {ptvTargetNum !== null && item.PTVMin > 0 && item.PTVMax > item.PTVMin && (() => {
                          const pct = Math.max(0, Math.min(100, ((ptvTargetNum - item.PTVMin) / (item.PTVMax - item.PTVMin)) * 100));
                          let ptvZone = t('ptvMidZone'); let zoneColor = '#34d399';
                          if (pct < 25) { ptvZone = t('ptvLowZone'); zoneColor = '#fbbf24'; }
                          else if (pct > 75) { ptvZone = t('ptvHighZone'); zoneColor = '#38bdf8'; }
                          return (
                            <div>
                              <div className="ptv-track"><div className="ptv-fill" style={{ width: `${pct}%`, backgroundColor: zoneColor }} /></div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: zoneColor }}>{t('ptvPosition', { pct: Math.round(pct), zone: ptvZone })}</span>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    {/* Non-glider items keep a plain PTV text line. */}
                    {(item.PTVMin > 0 || item.PTVMax > 0) && item !== glider && <div className="detail-row"><Gauge size={14} className="detail-row-icon" /><span className="detail-row-label">{t('ptvLabel')}</span><span className="detail-row-value">{item.PTVMin || '?'} - {item.PTVMax || '?'} kg</span></div>}
                    {item.taille && <div className="detail-row"><Maximize2 size={14} className="detail-row-icon" /><span className="detail-row-label">{t('sizeLabel')}</span><span className="detail-row-value">{item.taille}</span></div>}
                    {item.annee && <div className="detail-row"><Calendar size={14} className="detail-row-icon" /><span className="detail-row-label">{t('yearLabel')}</span><span className="detail-row-value">{item.annee}</span></div>}
                    {item.couleurVoile && <div className="detail-row"><Tag size={14} className="detail-row-icon" /><span className="detail-row-label">{t('colorLabel')}</span><span className="detail-row-value">{item.couleurVoile}{item.typeCode === '0' && <ColorPalette couleurVoile={item.couleurVoile} size={14} />}</span></div>}
                  </div>
                  {item.commentaire && (
                    <div className="card-comment"><FileText size={12} style={{ flexShrink: 0, marginTop: 2 }} /><span className="card-comment-text">{item.commentaire}</span></div>
                  )}
                  <button className="detail-action-btn" onClick={() => { const q = encodeURIComponent(`${searchLabel} ${keywords}`); window.open(`https://www.ecosia.org/search?q=${q}`, '_blank'); }}>
                    <Search size={14} color="var(--accent)" /> {t('searchEcosia')} ({searchLabel})
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-btn modal-btn--secondary" onClick={handleCopy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? t('copied') : t('copySummary')}
          </button>
        </div>
      </div>
    </div>
  );
};
