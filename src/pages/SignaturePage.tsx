import React, { useState, useRef, useEffect } from 'react';
import { quoteStorage, clientStorage, formatCurrencyAmount } from '../services/storage';
import { Quote } from '../types';
import { saveSignature } from '../services/eSignature';
import type { Signature } from '../services/eSignature';

const SignaturePage: React.FC = () => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isSigned, setIsSigned] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signerPhone, setSignerPhone] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const quoteId = params.get('quote');
    if (quoteId) {
      const foundQuote = quoteStorage.getById(quoteId);
      if (foundQuote) {
        setQuote(foundQuote);
        const foundClient = clientStorage.getById(foundQuote.clientId);
        if (foundClient) {
          setSignerName(foundClient.name);
          setSignerEmail(foundClient.email);
          setSignerPhone(foundClient.phone);
        }
      }
    }
  }, []);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let lastX = 0;
    let lastY = 0;

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      if ('touches' in e) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const startDraw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      setIsDrawing(true);
      const pos = getPos(e);
      lastX = pos.x;
      lastY = pos.y;
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;
    };

    const endDraw = () => setIsDrawing(false);

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    canvas.addEventListener('touchstart', startDraw);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', endDraw);

    return () => {
      canvas.removeEventListener('mousedown', startDraw);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', endDraw);
      canvas.removeEventListener('mouseleave', endDraw);
      canvas.removeEventListener('touchstart', startDraw);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', endDraw);
    };
  }, [isDrawing]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSign = () => {
    if (!quote || !signerName || !signerEmail) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL('image/png');

    const signature: Signature = {
      id: Date.now().toString(),
      quoteId: quote.id,
      signerName,
      signerEmail,
      signerPhone,
      signatureData,
      ipAddress: 'N/A',
      timestamp: new Date().toISOString(),
    };

    saveSignature(signature);
    setIsSigned(true);
  };

  if (!quote) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f9fafb' }}>
        <div className="empty-state">
          <p style={{ fontSize: '1.2rem' }}>❌ Devis introuvable</p>
          <p style={{ color: '#6b7280', marginTop: 8 }}>Lien invalide ou devis inexistant</p>
        </div>
      </div>
    );
  }

  if (isSigned) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0fdf4' }}>
        <div style={{ textAlign: 'center', background: 'white', padding: 40, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
          <h2 style={{ color: '#16a34a', marginBottom: 8 }}>Devis Signé !</h2>
          <p style={{ color: '#6b7280' }}>Merci {signerName}, votre signature a été enregistrée.</p>
          <p style={{ color: '#6b7280', marginTop: 8 }}>Devis #{quote.id.slice(0, 8).toUpperCase()}</p>
          <p style={{ color: '#6b7280', marginTop: 4 }}>{formatCurrencyAmount(quote.total, quote.currency)}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: 20 }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ background: '#2563eb', color: 'white', borderRadius: '12px 12px 0 0', padding: 30, textAlign: 'center' }}>
          <h1>📄 Devis #{quote.id.slice(0, 8).toUpperCase()}</h1>
          <p style={{ opacity: 0.9, marginTop: 8 }}>Signez pour accepter ce devis</p>
        </div>

        {/* Contenu */}
        <div style={{ background: 'white', borderRadius: '0 0 12px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: 30 }}>
          {/* Infos devis */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>Client</p>
              <p style={{ fontWeight: 600 }}>{quote.clientName}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>Total</p>
              <p style={{ fontWeight: 700, fontSize: '1.3rem', color: '#2563eb' }}>{formatCurrencyAmount(quote.total, quote.currency)}</p>
            </div>
          </div>

          {/* Tableau */}
          <table className="detail-table" style={{ marginBottom: 20 }}>
            <thead>
              <tr><th>Produit</th><th>Qté</th><th>Prix</th><th>Total</th></tr>
            </thead>
            <tbody>
              {quote.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.productName}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrencyAmount(item.unitPrice, quote.currency)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrencyAmount(item.total, quote.currency)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><td colSpan={3} style={{ textAlign: 'right' }}>Sous-total</td><td style={{ textAlign: 'right' }}>{formatCurrencyAmount(quote.subtotal, quote.currency)}</td></tr>
              <tr><td colSpan={3} style={{ textAlign: 'right' }}>TVA ({quote.taxRate}%)</td><td style={{ textAlign: 'right' }}>{formatCurrencyAmount(quote.tax, quote.currency)}</td></tr>
              <tr className="total-row"><td colSpan={3} style={{ textAlign: 'right', fontWeight: 700 }}>TOTAL</td><td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>{formatCurrencyAmount(quote.total, quote.currency)}</td></tr>
            </tfoot>
          </table>

          <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: 30 }}>
            Valide jusqu'au {new Date(quote.validUntil).toLocaleDateString('fr-FR')}
          </p>

          {/* Formulaire de signature */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 30 }}>
            <h3 style={{ marginBottom: 16 }}>✍️ Votre Signature</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="form-group">
                <label>Nom complet *</label>
                <input type="text" value={signerName} onChange={e => setSignerName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={signerEmail} onChange={e => setSignerEmail(e.target.value)} required />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Téléphone</label>
              <input type="tel" value={signerPhone} onChange={e => setSignerPhone(e.target.value)} />
            </div>

            {/* Zone de signature */}
            <div className="form-group">
              <label>Signez ci-dessous *</label>
              <div style={{ border: '2px solid #d1d5db', borderRadius: 8, overflow: 'hidden', background: 'white' }}>
                <canvas
                  ref={canvasRef}
                  style={{ width: '100%', height: 200, cursor: 'crosshair', touchAction: 'none' }}
                />
              </div>
              <button
                type="button"
                onClick={clearCanvas}
                style={{ marginTop: 8, padding: '6px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem' }}
              >
                🗑️ Effacer la signature
              </button>
            </div>

            {/* Bouton signer */}
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button
                className="btn btn-success"
                onClick={handleSign}
                disabled={!signerName || !signerEmail}
                style={{ padding: '15px 40px', fontSize: '1.1rem', fontWeight: 600 }}
              >
                ✅ Signer le devis
              </button>
            </div>

            <p style={{ color: '#9ca3af', fontSize: '0.8rem', textAlign: 'center', marginTop: 16 }}>
              En signant, vous confirmez l'acceptation de ce devis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignaturePage;
