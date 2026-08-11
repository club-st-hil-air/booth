import React, { useState } from 'react';
import { X, Settings, Database, RefreshCw, Cloud } from 'lucide-react';
import { DEFAULT_S3_URL } from '../data/mockData';
import { useI18n } from '../i18n/I18nContext';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  apiUrl: string;
  onSaveApiUrl: (url: string) => void;
  autoRefreshInterval: number;
  onSaveAutoRefresh: (seconds: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible, onClose, apiUrl, onSaveApiUrl, autoRefreshInterval, onSaveAutoRefresh,
}) => {
  const { t } = useI18n();
  const [tempUrl, setTempUrl] = useState(apiUrl);

  const handleSave = () => { onSaveApiUrl(tempUrl); onClose(); };
  const handleResetDefaultUrl = () => { setTempUrl(DEFAULT_S3_URL); };

  const refreshOptions = [
    { label: t('disabled'), value: 0 },
    { label: t('every60s'), value: 60 },
  ];

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={18} color="var(--accent)" />
            <span className="modal-title">{t('settingsTitle')}</span>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          {import.meta.env.DEV && (
            <div className="detail-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Database size={16} color="var(--accent)" />
                <span className="detail-section-title">{t('dataSourceTitle')}</span>
              </div>
              <p className="form-help">{t('dataSourceHelp')}</p>
              <input className="form-input" placeholder="https://..." value={tempUrl} onChange={(e) => setTempUrl(e.target.value)} />
              <button className="modal-btn modal-btn--secondary" onClick={handleResetDefaultUrl} style={{ marginTop: 8 }}>
                <Cloud size={13} /> {t('resetTestUrl')}
              </button>
            </div>
          )}

          <div className="detail-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={16} color="var(--success)" />
              <span className="detail-section-title">{t('autoRefreshTitle')}</span>
            </div>
            <p className="form-help">{t('autoRefreshHelp')}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {refreshOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`pill ${autoRefreshInterval === opt.value ? 'pill--active' : ''}`}
                  onClick={() => onSaveAutoRefresh(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-btn modal-btn--secondary" onClick={onClose}>{t('cancel')}</button>
          <button className="modal-btn modal-btn--primary" onClick={handleSave}>{t('save')}</button>
        </div>
      </div>
    </div>
  );
};
