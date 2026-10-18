import React, { useState } from 'react';
import { companyStorage, DEFAULT_COMPANY } from '../services/storage';
import { CompanyInfo } from '../types';
import PhotoUpload from './PhotoUpload';

const CompanySettings: React.FC = () => {
  const [info, setInfo] = useState<CompanyInfo>(() => companyStorage.get());
  const [saved, setSaved] = useState(false);

  const set = (k: keyof CompanyInfo, v: string) => {
    setInfo(prev => ({ ...prev, [k]: v }));
    setSaved(false);
  };

  const handleSave = () => {
    companyStorage.save(info);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Réinitialiser les infos entreprise par défaut ?')) {
      setInfo({ ...DEFAULT_COMPANY });
      setSaved(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', fontSize: 15,
    borderRadius: 8, border: '1px solid #cbd5e1', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.85rem', fontWeight: 600,
    color: '#475569', marginBottom: 6,
  };

  const field = (label: string, key: keyof CompanyInfo, placeholder = '') => (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <input
        style={inputStyle}
        value={info[key]}
        placeholder={placeholder}
        onChange={e => set(key, e.target.value)}
      />
    </div>
  );

  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0',
      borderRadius: 12, padding: 20, marginBottom: 24,
    }}>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
        🏢 Paramétrage de l'entreprise
      </div>
      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 20 }}>
        Ces informations apparaîtront sur vos devis, factures et bons de livraison.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <PhotoUpload
          currentPhoto={info.logo}
          onPhotoChange={(photo) => set('logo', photo)}
          size={120}
        />
      </div>

      {field('Raison sociale *', 'name', 'TRADE LINK INTERNATIONALE')}
      {field('Adresse', 'address', 'N° rue, quartier…')}
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>{field('Ville', 'city', 'Tanger')}</div>
        <div style={{ flex: 1 }}>{field('Site web', 'website', 'www…')}</div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>{field('Téléphone', 'phone', '06…')}</div>
        <div style={{ flex: 1 }}>{field('E-mail', 'email', 'contact@…')}</div>
      </div>

      <div style={{
        fontSize: '0.85rem', fontWeight: 700, color: '#475569',
        margin: '18px 0 12px', paddingTop: 12, borderTop: '1px solid #f1f5f9',
      }}>
        Identifiants fiscaux (Maroc)
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>{field('ICE (15 chiffres)', 'ice', '000000000000000')}</div>
        <div style={{ flex: 1 }}>{field('IF', 'ifFiscal', '')}</div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>{field('RC', 'rc', '')}</div>
        <div style={{ flex: 1 }}>{field('Taxe Professionnelle', 'taxePro', '')}</div>
      </div>
      {field('CNSS', 'cnss', '')}

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={handleSave} style={{ flex: 1 }}>
          💾 Enregistrer
        </button>
        <button className="btn btn-secondary" onClick={handleReset}>
          Réinitialiser
        </button>
      </div>
      {saved && (
        <div style={{ marginTop: 12, color: '#166534', fontSize: '0.9rem', textAlign: 'center' }}>
          ✅ Informations enregistrées
        </div>
      )}
    </div>
  );
};

export default CompanySettings;
