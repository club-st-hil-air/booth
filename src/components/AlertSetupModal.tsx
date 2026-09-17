import React, { useState } from 'react';
import { X, Bell, Info } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

interface AlertSetupModalProps {
  visible: boolean;
  filterSummary: string;
  /** True when the browser supports Notification AND permission isn't denied. */
  canRequestNotification: boolean;
  onConfirm: (wantsBrowserNotification: boolean) => void;
  onCancel: () => void;
}

/**
 * Lightweight confirmation shown when the user turns an alert ON. It does NOT
 * re-ask the criteria (already set via the filters) — it confirms scope, states
 * the tab-open limitation, and optionally opts into a browser notification.
 */
export const AlertSetupModal: React.FC<AlertSetupModalProps> = ({
  visible, filterSummary, canRequestNotification, onConfirm, onCancel,
}) => {
  const { t } = useI18n();
  const [wantsNotification, setWantsNotification] = useState(false);

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={18} color="var(--accent)" />
            <span className="modal-title">{t('alertSetupTitle')}</span>
          </div>
          <button className="modal-close" onClick={onCancel}><X size={20} /></button>
        </div>

        <div className="modal-body">
          <p className="form-help">{t('alertSetupIntro')}</p>

          <div className="alert-setup-filter">
            <span className="alert-setup-filter-label">{t('alertSetupWatching')}</span>
            <span className="alert-setup-filter-value">{filterSummary}</span>
          </div>

          <div className="alert-setup-note">
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{t('alertSetupTabOpen')}</span>
          </div>

          {canRequestNotification && (
            <label className="alert-setup-checkbox">
              <input
                type="checkbox"
                checked={wantsNotification}
                onChange={(e) => setWantsNotification(e.target.checked)}
              />
              <span>{t('alertSetupBrowserNotif')}</span>
            </label>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn modal-btn--secondary" onClick={onCancel}>{t('cancel')}</button>
          <button className="modal-btn modal-btn--primary" onClick={() => onConfirm(wantsNotification)}>
            <Bell size={15} /> {t('alertSetupConfirm')}
          </button>
        </div>
      </div>
    </div>
  );
};
