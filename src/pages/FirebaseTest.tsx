import React, { useState } from 'react';
import { db, COLLECTIONS } from '../services/firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';

const FirebaseTest: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [testRunning, setTestRunning] = useState(false);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const clearLogs = () => setLogs([]);

  const runTest = async () => {
    setTestRunning(true);
    clearLogs();
    addLog('🚀 Début du test Firebase...');

    // Test 1: Écriture
    try {
      addLog('📝 Test 1: Écriture dans Firestore...');
      const testDoc = {
        id: 'test-sync-' + Date.now(),
        name: 'Produit Test Sync',
        price: 999,
        stock: 10,
        category: 'Test',
        description: 'Test de synchronisation',
        createdAt: new Date().toISOString(),
      };
      const docRef = doc(db, COLLECTIONS.PRODUCTS, testDoc.id);
      await setDoc(docRef, testDoc);
      addLog(`✅ Écriture réussie ! ID: ${testDoc.id}`);
    } catch (e: any) {
      addLog(`❌ Écriture échouée: ${e.message}`);
      addLog(`   Code: ${e.code}`);
    }

    // Test 2: Lecture
    try {
      addLog('📖 Test 2: Lecture depuis Firestore...');
      const snapshot = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
      const count = snapshot.docs.length;
      addLog(`✅ Lecture réussie ! ${count} document(s) trouvé(s)`);
      snapshot.docs.forEach(d => {
        addLog(`   - ${d.id}: ${d.data().name || 'sans nom'}`);
      });
    } catch (e: any) {
      addLog(`❌ Lecture échouée: ${e.message}`);
      addLog(`   Code: ${e.code}`);
    }

    // Test 3: Écoute temps réel
    try {
      addLog('🔄 Test 3: Écoute temps réel...');
      let received = false;
      const unsub = onSnapshot(
        collection(db, COLLECTIONS.PRODUCTS),
        (snapshot) => {
          if (!received) {
            received = true;
            addLog(`✅ Écoute temps réel OK ! ${snapshot.docs.length} document(s)`);
            unsub();
          }
        },
        (error) => {
          addLog(`❌ Écoute temps réel échouée: ${error.message}`);
        }
      );
      // Attendre 3 secondes pour recevoir la réponse
      await new Promise(r => setTimeout(r, 3000));
      if (!received) {
        addLog('⚠️ Pas de réponse temps réel après 3s');
        unsub();
      }
    } catch (e: any) {
      addLog(`❌ Erreur écoute: ${e.message}`);
    }

    addLog('🏁 Test terminé !');
    setTestRunning(false);
  };

  const cleanupTestDocs = async () => {
    addLog('🗑️ Nettoyage des documents de test...');
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
      for (const d of snapshot.docs) {
        if (d.id.startsWith('test-sync-')) {
          await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, d.id));
          addLog(`   Supprimé: ${d.id}`);
        }
      }
      addLog('✅ Nettoyage terminé');
    } catch (e: any) {
      addLog(`❌ Nettoyage échoué: ${e.message}`);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header">
        <h2>🔧 Test de Synchronisation Firebase</h2>
      </div>

      <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <h3>Ce que fait ce test :</h3>
        <ol style={{ lineHeight: 2 }}>
          <li><strong>Écriture</strong> — Envoie un produit test vers Firestore (le cloud)</li>
          <li><strong>Lecture</strong> — Récupère tous les produits depuis Firestore</li>
          <li><strong>Temps réel</strong> — Vérifie que les mises à jour sont reçues automatiquement</li>
        </ol>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button
          className="btn btn-primary"
          onClick={runTest}
          disabled={testRunning}
          style={{ fontSize: '1.1rem', padding: '12px 24px' }}
        >
          {testRunning ? '⏳ Test en cours...' : '🚀 Lancer le test'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={cleanupTestDocs}
          disabled={testRunning}
        >
          🗑️ Nettoyer les tests
        </button>
      </div>

      {logs.length > 0 && (
        <div style={{
          background: '#1a1a2e',
          color: '#e0e0e0',
          borderRadius: 12,
          padding: 20,
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          maxHeight: 400,
          overflow: 'auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <strong style={{ color: '#4ade80' }}>📋 Résultats du test</strong>
            <button
              onClick={clearLogs}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
            >
              Effacer
            </button>
          </div>
          {logs.map((log, i) => (
            <div key={i} style={{ padding: '2px 0', color: log.startsWith('✅') ? '#4ade80' : log.startsWith('❌') ? '#f87171' : log.startsWith('⚠️') ? '#fbbf24' : '#e0e0e0' }}>
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FirebaseTest;
