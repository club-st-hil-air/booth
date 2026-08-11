import React, { useState } from 'react';
import { X, Calculator, Gauge, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

interface PTVCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
  currentPtv: string;
  onApplyPtv: (ptvValue: string) => void;
}

export const PTVCalculatorModal: React.FC<PTVCalculatorModalProps> = ({
  visible, onClose, currentPtv, onApplyPtv,
}) => {
  const { t } = useI18n();
  const [pilotWeight, setPilotWeight] = useState('75');
  const [gliderWeight, setGliderWeight] = useState('4.5');
  const [harnessWeight, setHarnessWeight] = useState('3.5');
  const [reserveWeight, setReserveWeight] = useState('1.8');
  const [extraWeight, setExtraWeight] = useState('3.0');

  const pNum = parseFloat(pilotWeight) || 0;
  const gNum = parseFloat(gliderWeight) || 0;
  const hNum = parseFloat(harnessWeight) || 0;
  const rNum = parseFloat(reserveWeight) || 0;
  const eNum = parseFloat(extraWeight) || 0;
  const totalPtv = Math.round((pNum + gNum + hNum + rNum + eNum) * 10) / 10;

  const handleApply = () => { onApplyPtv(totalPtv.toString()); onClose(); };
  const handleClear = () => { onApplyPtv(''); onClose(); };

  if (!visible) return null;

  const fields = [
    { label: t('pilotWeightLabel'), value: pilotWeight, set: setPilotWeight },
    { label: t('gliderWeightLabel'), value: gliderWeight, set: setGliderWeight },
    { label: t('harnessWeightLabel'), value: harnessWeight, set: setHarnessWeight },
    { label: t('reserveWeightLabel'), value: reserveWeight, set: setReserveWeight },
    { label: t('extraWeightLabel'), value: extraWeight, set: setExtraWeight },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calculator size={18} color="var(--accent)" />
            <span className="modal-title">{t('ptvCalcTitle')}</span>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <p className="form-help" style={{ margin: 0, lineHeight: 1.5 }}>{t('ptvCalcIntro')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            {fields.map((f) => (
              <div key={f.label}>
                <label className="form-label">{f.label}</label>
                <input className="form-input" type="number" step="0.1" value={f.value} onChange={(e) => f.set(e.target.value)} />
              </div>
            ))}
          </div>

          <div className="ptv-gauge" style={{ alignItems: 'center', textAlign: 'center', marginTop: 12 }}>
            <Gauge size={24} color="var(--accent)" />
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
              {totalPtv} kg
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('ptvTotalLabel')}</div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-btn modal-btn--danger" onClick={handleClear}>{t('ptvClear')}</button>
          <button className="modal-btn modal-btn--primary" onClick={handleApply}>
            <Sparkles size={14} /> {t('ptvApply')}
          </button>
        </div>
      </div>
    </div>
  );
};
