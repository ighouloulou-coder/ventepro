// ============================================
Muse API — Trade Link Backend
Endpoints pour l'intégration avec Meta Muse
Nécessite Node.js 18+ et les dépendances : express, firebase-admin
============================================

import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';

// ⚠️ CONFIGURATION FIREBASE — À MODIFIER AVEC VOS CRÉDENTIELS
const firebaseConfig = {
  apiKey: "AIzaSyDV6LdXrfQxZGv8KiDVTv7mbr1fz_VmUC0",
  authDomain: "ventepro-714f5.firebaseapp.com",
  projectId: "ventepro-714f5",
  storageBucket: "ventepro-714f5.firebasestorage.app",
  messagingSenderId: "213916622362",
  appId: "1:213916622362:web:fd219ffab51fc03892fba3",
};

// Initialiser Firebase Admin
try {
  admin.initializeApp(firebaseConfig);
  console.log('✅ Firebase Admin initialisé');
} catch (e) {
  console.error('❌ Erreur initialisation Firebase Admin:', e);
  process.exit(1);
}

const db = admin.firestore();
const app = express();

// Middleware
app.use(cors({ origin: '*' })); // À restreindre en production
app.use(express.json());

// ============================================
🔐 Authentification simple (à sécuriser en production)
Utilisez une clé API ou JWT dans un environnement réel
============================================

// Middleware d'authentification simplifié pour Muse
const museAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const apiKey = req.headers['x-api-key'];
  
  // En développement : accepter sans clé (à retirer en prod)
  // En production : vérifier apiKey contre vos registres
  if (process.env.NODE_ENV !== 'production' && !authHeader && !apiKey) {
    return next();
  }
  
  // TODO : Implémenter la vérification JWT ou API key
  // Exemple : const user = verifyToken(authHeader || apiKey);
  // if (!user) return res.status(401).json({ error: 'Non autorisé' });
  
  next();
};

app.use(museAuth);

// ============================================
📦 PRODUITS
============================================

// GET /api/products - Lister tous les produits
app.get('/api/products', async (req, res) => {
  try {
    const snapshot = await db.collection('tradelink_products').get();
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('Erreur lecture produits:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/products/:id - Obtenir un produit
app.get('/api/products/:id', async (req, res) => {
  try {
    const doc = await db.collection('tradelink_products').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Erreur lecture produit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/products - Créer un produit
app.post('/api/products', async (req, res) => {
  try {
    const data = req.body;
    const product = {
      ...data,
      createdAt: admin.firestore.Timestamp.now().toString(),
    };
    const docRef = await db.collection('tradelink_products').add(product);
    res.json({ success: true, id: docRef.id, data });
  } catch (error) {
    console.error('Erreur création produit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/products/:id - Mettre à jour un produit
app.put('/api/products/:id', async (req, res) => {
  try {
    const data = req.body;
    await db.collection('tradelink_products').doc(req.params.id).update(data);
    res.json({ success: true, id: req.params.id, data });
  } catch (error) {
    console.error('Erreur mise à jour produit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE /api/products/:id - Supprimer un produit
app.delete('/api/products/:id', async (req, res) => {
  try {
    await db.collection('tradelink_products').doc(req.params.id).delete();
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    console.error('Erreur suppression produit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// ============================================
👥 CLIENTS
============================================

// GET /api/clients - Lister tous les clients
app.get('/api/clients', async (req, res) => {
  try {
    const snapshot = await db.collection('tradelink_clients').get();
    const clients = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json({ success: true, count: clients.length, data: clients });
  } catch (error) {
    console.error('Erreur lecture clients:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/clients/:id - Obtenir un client
app.get('/api/clients/:id', async (req, res) => {
  try {
    const doc = await db.collection('tradelink_clients').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Erreur lecture client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/clients - Créer un client
app.post('/api/clients', async (req, res) => {
  try {
    const data = req.body;
    const client = {
      ...data,
      createdAt: admin.firestore.Timestamp.now().toString(),
    };
    const docRef = await db.collection('tradelink_clients').add(client);
    res.json({ success: true, id: docRef.id, data });
  } catch (error) {
    console.error('Erreur création client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/clients/:id - Mettre à jour un client
app.put('/api/clients/:id', async (req, res) => {
  try {
    await db.collection('tradelink_clients').doc(req.params.id).update(req.body);
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    console.error('Erreur mise à jour client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/clients/:id - Supprimer un client
app.delete('/api/clients/:id', async (req, res) => {
  try {
    await db.collection('tradelink_clients').doc(req.params.id).delete();
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    console.error('Erreur suppression client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// ============================================
🧾 FACTURES
============================================

// GET /api/invoices - Lister toutes les factures
app.get('/api/invoices', async (req, res) => {
  try {
    const snapshot = await db.collection('tradelink_invoices').get();
    const invoices = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (error) {
    console.error('Erreur lecture factures:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/invoices/:id - Obtenir une facture
app.get('/api/invoices/:id', async (req, res) => {
  try {
    const doc = await db.collection('tradelink_invoices').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }
    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Erreur lecture facture:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/invoices - Créer une facture
app.post('/api/invoices', async (req, res) => {
  try {
    const data = req.body;
    const invoice = {
      ...data,
      createdAt: admin.firestore.Timestamp.now().toString(),
      status: 'brouillon',
    };
    const docRef = await db.collection('tradelink_invoices').add(invoice);
    res.json({ success: true, id: docRef.id, data });
  } catch (error) {
    console.error('Erreur création facture:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/invoices/:id - Mettre à jour une facture
app.put('/api/invoices/:id', async (req, res) => {
  try {
    await db.collection('tradelink_invoices').doc(req.params.id).update(req.body);
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    console.error('Erreur mise à jour facture:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/invoices/:id - Supprimer une facture
app.delete('/api/invoices/:id', async (req, res) => {
  try {
    await db.collection('tradelink_invoices').doc(req.params.id).delete();
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    console.error('Erreur suppression facture:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// ============================================
🚚 LIVRAISONS / COMMANDES
============================================

// GET /api/deliveries - Lister toutes les livraisons
app.get('/api/deliveries', async (req, res) => {
  try {
    const snapshot = await db.collection('tradelink_deliveries').get();
    const deliveries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json({ success: true, count: deliveries.length, data: deliveries });
  } catch (error) {
    console.error('Erreur lecture livraisons:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/deliveries/:id - Obtenir une livraison
app.get('/api/deliveries/:id', async (req, res) => {
  try {
    const doc = await db.collection('tradelink_deliveries').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Livraison non trouvée' });
    }
    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Erreur lecture livraison:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/deliveries - Créer une livraison
app.post('/api/deliveries', async (req, res) => {
  try {
    const data = req.body;
    const delivery = {
      ...data,
      createdAt: admin.firestore.Timestamp.now().toString(),
      status: 'préparation',
    };
    const docRef = await db.collection('tradelink_deliveries').add(delivery);
    res.json({ success: true, id: docRef.id, data });
  } catch (error) {
    console.error('Erreur création livraison:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
📊 TABLEAU DE BORD
============================================

// GET /api/dashboard - Statistiques générales
app.get('/api/dashboard', async (req, res) => {
  try {
    // Récupérer les stats depuis Firestore
    const [productsSnap, clientsSnap, invoicesSnap, deliveriesSnap] = await Promise.all([
      db.collection('tradelink_products').get(),
      db.collection('tradelink_clients').get(),
      db.collection('tradelink_invoices').get(),
      db.collection('tradelink_deliveries').get(),
    ]);

    const products = productsSnap.docs.length;
    const clients = clientsSnap.docs.length;
    const invoices = invoicesSnap.docs.length;
    const deliveries = deliveriesSnap.docs.length;

    // Calculer le chiffre d'affaires (factures payées)
    const payedInvoices = invoicesSnap.docs.filter(
      doc => doc.data().status === 'payée'
    );
    const totalSales = payedInvoices.reduce((sum, doc) => sum + (doc.data().total || 0), 0);

    res.json({
      success: true,
      stats: {
        totalProducts: products,
        totalClients: clients,
        totalInvoices: invoices,
        totalDeliveries: deliveries,
        totalSales,
      },
    });
  } catch (error) {
    console.error('Erreur dashboard:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
Lancement du serveur
============================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Muse API Trade Link démarré sur http://localhost:${PORT}`);
  console.log('📚 Endpoints disponibles :');
  console.log('   GET   /api/products');
  console.log('   GET   /api/products/:id');
  console.log('   POST  /api/products');
  console.log('   PUT   /api/products/:id');
  console.log('   DELETE /api/products/:id');
  console.log('   GET   /api/clients');
  console.log('   GET   /api/clients/:id');
  console.log('   POST  /api/clients');
  console.log('   GET   /api/invoices');
  console.log('   GET   /api/invoices/:id');
  console.log('   POST  /api/invoices');
  console.log('   GET   /api/deliveries');
  console.log('   GET   /api/deliveries/:id');
  console.log('   POST  /api/deliveries');
  console.log('   GET   /api/dashboard');
  console.log('---');
  console.log('🔑 Pour Muse : utilisez les endpoints selon vos besoins');
  console.log('⚠️ En production, sécurisez avec API Key ou JWT');
});