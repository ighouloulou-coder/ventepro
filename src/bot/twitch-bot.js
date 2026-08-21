// ============================================
// 🤖 Bot Twitch - VentePro
// ============================================
// Commande : npm run bot

import tmi from 'tmi.js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Charger les variables d'environnement
config();

// Chemins pour les données
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');

// Créer le dossier data s'il n'existe pas
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ============================================
// Configuration du Bot
// ============================================
const client = new tmi.Client({
  options: { debug: true },
  connection: {
    secure: true,
    reconnect: true
  },
  identity: {
    username: process.env.TWITCH_USERNAME || 'your_username',
    password: process.env.TWITCH_OAUTH || 'oauth:your_token'
  },
  channels: [process.env.TWITCH_CHANNEL || 'your_channel']
});

// ============================================
// Données du Bot
// ============================================
const botStats = {
  commandsUsed: 0,
  viewersGreeted: [],
  salesAnnounced: []
};

// ============================================
// Fonctions utilitaires
// ============================================

// Lire les données de ventes
function getSalesData() {
  const salesFile = path.join(DATA_DIR, 'sales.json');
  if (fs.existsSync(salesFile)) {
    return JSON.parse(fs.readFileSync(salesFile, 'utf8'));
  }
  return { total: 0, today: 0, recentSales: [] };
}

// Sauvegarder les données de ventes
function saveSalesData(data) {
  const salesFile = path.join(DATA_DIR, 'sales.json');
  fs.writeFileSync(salesFile, JSON.stringify(data, null, 2));
}

// Formater la devise en MAD
function formatMAD(amount) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2
  }).format(amount);
}

// Obtenir l'heure actuelle
function getCurrentTime() {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// ============================================
// Commandes du Bot
// ============================================
const commands = {
  // Commande !vente - Enregistrer une vente
  vente: (channel, tags, message) => {
    const args = message.split(' ');
    if (args.length < 2) {
      return `@${tags.username} Usage: !vente [montant] [description]`;
    }

    const amount = parseFloat(args[1]);
    if (isNaN(amount) || amount <= 0) {
      return `@${tags.username} ❌ Montant invalide. Usage: !vente 100 Produit XYZ`;
    }

    const description = args.slice(2).join(' ') || 'Vente sans description';

    // Sauvegarder la vente
    const salesData = getSalesData();
    const sale = {
      id: Date.now(),
      amount,
      description,
      seller: tags.username,
      time: getCurrentTime(),
      date: new Date().toISOString()
    };

    salesData.total += amount;
    salesData.today += amount;
    salesData.recentSales.unshift(sale);
    salesData.recentSales = salesData.recentSales.slice(0, 10); // Garder les 10 dernières

    saveSalesData(salesData);
    botStats.commandsUsed++;

    return `@${tags.username} ✅ Vente enregistrée ! 💰 ${formatMAD(amount)} - ${description}`;
  },

  // Commande !stats - Afficher les statistiques
  stats: (channel, tags) => {
    const salesData = getSalesData();
    botStats.commandsUsed++;

    return [
      `@${tags.username} 📊 Statistiques VentePro:`,
      `💰 Total: ${formatMAD(salesData.total)}`,
      `📅 Aujourd'hui: ${formatMAD(salesData.today)}`,
      `🛒 Nombre de ventes: ${salesData.recentSales.length}`
    ].join(' | ');
  },

  // Commande !dernières - Dernières ventes
  dernieres: (channel, tags) => {
    const salesData = getSalesData();
    botStats.commandsUsed++;

    if (salesData.recentSales.length === 0) {
      return `@${tags.username} 📭 Aucune vente enregistrée`;
    }

    const recent = salesData.recentSales.slice(0, 3).map(s =>
      `💰 ${formatMAD(s.amount)} - ${s.description}`
    ).join(' | ');

    return `@${tags.username} 🛒 Dernières ventes: ${recent}`;
  },

  // Commande !bonjour - Saluer un viewer
  bonjour: (channel, tags) => {
    botStats.commandsUsed++;
    if (!botStats.viewersGreeted.includes(tags.username)) {
      botStats.viewersGreeted.push(tags.username);
    }
    return `@${tags.username} 👋 Bienvenue sur la chaîne ! N'hésitez pas à poser vos questions !`;
  },

  // Commande !aide - Afficher l'aide
  aide: (channel, tags) => {
    botStats.commandsUsed++;
    return [
      `@${tags.username} 📖 Commandes disponibles:`,
      `!vente [montant] [desc] - Enregistrer une vente`,
      `!stats - Voir les statistiques`,
      `!dernières - Dernières ventes`,
      `!bonjour - Saluer le bot`,
      `!aide - Afficher cette aide`
    ].join(' | ');
  },

  // Commande !reset - Réinitialiser le jour
  reset: (channel, tags) => {
    const salesData = getSalesData();
    salesData.today = 0;
    saveSalesData(salesData);
    botStats.commandsUsed++;
    return `@${tags.username} 🔄 Compteur du jour réinitialisé !`;
  },

  // Commande !uptime - Temps de fonctionnement
  uptime: (channel, tags) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    botStats.commandsUsed++;
    return `@${tags.username} ⏱️ Bot en ligne depuis ${hours}h ${minutes}min`;
  },

  // Commande !commands - Nombre de commandes utilisées
  commands: (channel, tags) => {
    botStats.commandsUsed++;
    return `@${tags.username} 🤖 ${botStats.commandsUsed} commandes utilisées cette session`;
  }
};

// ============================================
// Événements du Bot
// ============================================

// Connexion
client.on('connected', (addr, port) => {
  console.log('===========================================');
  console.log('🤖 Bot Twitch VentePro connecté !');
  console.log(`📍 Connecté à: ${addr}:${port}`);
  console.log(`📺 Chaîne: ${process.env.TWITCH_CHANNEL}`);
  console.log(`⏰ Heure: ${getCurrentTime()}`);
  console.log('===========================================');
  console.log('Commandes disponibles:');
  console.log('  !vente [montant] [desc] - Enregistrer une vente');
  console.log('  !stats - Statistiques');
  console.log('  !dernières - Dernières ventes');
  console.log('  !aide - Aide');
  console.log('  !reset - Réinitialiser le compteur du jour');
  console.log('===========================================');
});

// Message reçu
client.on('message', (channel, tags, message, self) => {
  // Ignorer les propres messages
  if (self) return;

  // Vérifier si c'est une commande
  if (!message.startsWith('!')) return;

  const commandName = message.split(' ')[0].toLowerCase().slice(1);
  const command = commands[commandName];

  if (command) {
    const response = command(channel, tags, message);
    if (response) {
      client.say(channel, response);
    }
  }
});

// Viewer rejoint
client.on('join', (channel, username, self) => {
  if (self) return;
  console.log(`👋 ${username} a rejoint le chat`);
});

// Viewer quitte
client.on('part', (channel, username, self) => {
  if (self) return;
  console.log(`👋 ${username} a quitté le chat`);
});

// ============================================
// Connexion au chat
// ============================================
console.log('🔄 Connexion au chat Twitch...');
client.connect().catch(err => {
  console.error('❌ Erreur de connexion:', err);
  console.log('');
  console.log('📝 Veuillez vérifier votre fichier .env:');
  console.log('   TWITCH_USERNAME=votre_username');
  console.log('   TWITCH_OAUTH=oauth:votre_token');
  console.log('   TWITCH_CHANNEL=votre_channel');
  console.log('');
  console.log('🔑 Pour obtenir votre token:');
  console.log('   1. Allez sur https://twitchapps.com/tmi/');
  console.log('   2. Cliquez sur "Connect"');
  console.log('   3. Copiez le token');
});
