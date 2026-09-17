import React from 'react';
import { Bell, X, ArrowRight } from 'lucide-react';
import { Article } from '../types';
import { shortLotDescription } from '../utils/notifications';
import { useI18n } from '../i18n/I18nContext';

interface NewMatchesToastProps {
  matches: Article[];
  filterSummary: string;
  onView: () => void;
  onDismiss: () => void;
}

/**
 * Non-blocking popup shown when new lots matching the user's watched filter
 * appear on a refresh. Lists the new lots with a short description and a button
 * to jump to them (applies the watched filter and closes).
 */
export const NewMatchesToast: React.FC<NewMatchesToastProps> = ({ matches, filterSummary, onView, onDismiss }) => {
  const { t } = useI18n();
  if (matches.length === 0) return null;

  const shown = matches.slice(0, 5);
  const extra = matches.length - shown.length;

  return (
    <div className="alert-toast" role="alert" aria-live="polite">
      <div className="alert-toast-header">
        <div className="alert-toast-title">
          <Bell size={16} color="var(--accent)" />
          <span>{t('alertNewMatchTitle', { count: matches.length })}</span>
        </div>
        <button className="alert-toast-close" onClick={onDismiss} aria-label={t('alertClose')}>
          <X size={16} />
        </button>
      </div>

      <div className="alert-toast-filter">{filterSummary}</div>

      <ul className="alert-toast-list">
        {shown.map((lot) => (
          <li key={lot.idLot} className="alert-toast-item">
            <span className="alert-toast-item-lot">#{lot.numeroCoupon}</span>
            <span className="alert-toast-item-desc">{shortLotDescription(lot)}</span>
          </li>
        ))}
        {extra > 0 && (
          <li className="alert-toast-item alert-toast-item--more">{t('alertAndMore', { count: extra })}</li>
        )}
      </ul>

      <button className="alert-toast-btn" onClick={onView}>
        {t('alertViewBtn')} <ArrowRight size={15} />
      </button>
    </div>
  );
};
