// ============================================
// 🧠 AI Agent - Assistant Intelligent
// ============================================
import { productStorage, clientStorage, invoiceStorage, quoteStorage, orderStorage } from './storage';
import { supplierStorage } from './supplierStorage';

// ============================================
// 📊 Collecte de données pour l'IA
// ============================================
function getBusinessContext(): string {
  const products = productStorage.getAll();
  const clients = clientStorage.getAll();
  const invoices = invoiceStorage.getAll();
  const quotes = quoteStorage.getAll();
  const orders = orderStorage.getAll();
  const suppliers = supplierStorage.getAll();

  const totalSales = invoices.filter(i => i.status === 'payée').reduce((s, i) => s + i.total, 0);
  const pendingInvoices = invoices.filter(i => i.status !== 'payée' && i.status !== 'annulée');
  const overdueInvoices = invoices.filter(i => i.status === 'en_retard');
  const pendingQuotes = quotes.filter(q => q.status === 'brouillon' || q.status === 'envoyé');
  const pendingOrders = orders.filter(o => o.status === 'en_attente' || o.status === 'confirmée');

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const topClients = clients.slice(0, 5);

  return `
CONTEXTE BUSINESS - TRADE LINK INTERNATIONALE:
- ${products.length} produits (${lowStockProducts.length} en stock bas)
- ${clients.length} clients
- ${invoices.length} factures (${pendingInvoices.length} en attente, ${overdueInvoices.length} en retard)
- ${quotes.length} devis (${pendingQuotes.length} en attente)
- ${orders.length} commandes (${pendingOrders.length} en attente)
- ${suppliers.length} fournisseurs
- Ventes totales: ${totalSales} MAD
- Produits en stock bas: ${lowStockProducts.map(p => `${p.name} (${p.stock} restants)`).join(', ')}
- Factures en retard: ${overdueInvoices.map(i => `#${i.id.slice(0, 6)} (${i.total} MAD)`).join(', ')}
  `.trim();
}

// ============================================
// 🤖 Prompt système pour l'IA
// ============================================
const SYSTEM_PROMPT = `Tu es l'assistant intelligent de TRADE LINK INTERNATIONALE, une entreprise de vente en gros au Maroc.

Ton rôle:
1. Analyser les données de l'entreprise et donner des conseils
2. Aider à prendre des décisions commerciales
3. Expliquer les tendances de vente
4. Suggérer des actions pour améliorer le business
5. Répondre aux questions sur les produits, clients, factures

Tu parles en français. Tu es professionnel, concis et utile.
Tu peux accéder aux données en temps réel de l'entreprise.

Format de réponse: utilise des emojis, sois structuré, donne des chiffres concrets.`;

// ============================================
// 💬 Historique de conversation
// ============================================
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

let conversationHistory: ChatMessage[] = [];
const MAX_HISTORY = 20;

// ============================================
// 🧠 Fonctions d'analyse locale (sans API)
// ============================================
function analyzeLocally(message: string): string | null {
  const lower = message.toLowerCase();
  const products = productStorage.getAll();
  const clients = clientStorage.getAll();
  const invoices = invoiceStorage.getAll();
  const orders = orderStorage.getAll();
  const quotes = quoteStorage.getAll();

  // === Ventes ===
  if (lower.includes('vente') || lower.includes('chiffre') || lower.includes('revenu')) {
    const totalSales = invoices.filter(i => i.status === 'payée').reduce((s, i) => s + i.total, 0);
    const monthlySales = invoices
      .filter(i => i.status === 'payée' && new Date(i.createdAt).getMonth() === new Date().getMonth())
      .reduce((s, i) => s + i.total, 0);
    return `📊 **Analyse des Ventes**\n\n💰 Ventes totales: **${totalSales.toLocaleString('fr-FR')} MAD**\n📅 Ce mois: **${monthlySales.toLocaleString('fr-FR')} MAD**\n📄 ${invoices.length} factures au total\n\n💡 ${totalSales > 100000 ? 'Excellent chiffre d\'affaires !' : 'Il y a de la place pour la croissance.'}`;
  }

  // === Produits ===
  if (lower.includes('produit') || lower.includes('stock')) {
    const lowStock = products.filter(p => p.stock <= p.minStock);
    const outOfStock = products.filter(p => p.stock === 0);
    return `📦 **État des Produits**\n\n📊 ${products.length} produits au total\n⚠️ ${lowStock.length} produits en stock bas\n❌ ${outOfStock.length} produits en rupture\n\n${lowStock.length > 0 ? '🔴 **Action recommandée:** Réapprovisionner: ' + lowStock.map(p => p.name).join(', ') : '✅ Tous les stocks sont OK'}`;
  }

  // === Clients ===
  if (lower.includes('client')) {
    const topClients = [...clients].sort((a, b) => {
      const aInvoices = invoices.filter(i => i.clientId === a.id && i.status === 'payée');
      const bInvoices = invoices.filter(i => i.clientId === b.id && i.status === 'payée');
      const aTotal = aInvoices.reduce((s, i) => s + i.total, 0);
      const bTotal = bInvoices.reduce((s, i) => s + i.total, 0);
      return bTotal - aTotal;
    }).slice(0, 5);

    return `👥 **Analyse Clients**\n\n📊 ${clients.length} clients enregistrés\n\n🏆 **Top 5 Clients:**\n${topClients.map((c, i) => `${i + 1}. ${c.name} - ${invoices.filter(i => i.clientId === c.id && i.status === 'payée').reduce((s, i) => s + i.total, 0).toLocaleString('fr-FR')} MAD`).join('\n')}`;
  }

  // === Factures ===
  if (lower.includes('facture') || lower.includes('impayé') || lower.includes('retard')) {
    const overdue = invoices.filter(i => i.status === 'en_retard');
    const pending = invoices.filter(i => i.status !== 'payée' && i.status !== 'annulée' && i.status !== 'en_retard');
    const overdueTotal = overdue.reduce((s, i) => s + (i.total - (i.paidAmount || 0)), 0);

    return `🧾 **État des Factures**\n\n📄 ${invoices.length} factures au total\n⏳ ${pending.length} en attente\n🚨 ${overdue.length} en retard (${overdueTotal.toLocaleString('fr-FR')} MAD)\n\n${overdue.length > 0 ? '⚠️ **Action urgente:** Relancer les clients en retard !' : '✅ Pas de factures en retard'}`;
  }

  // === Commandes ===
  if (lower.includes('commande')) {
    const pending = orders.filter(o => o.status === 'en_attente' || o.status === 'confirmée');
    const totalOrders = orders.reduce((s, o) => s + o.total, 0);
    return `📋 **État des Commandes**\n\n📦 ${orders.length} commandes au total\n⏳ ${pending.length} en attente\n💰 ${totalOrders.toLocaleString('fr-FR')} MAD au total\n\n${pending.length > 5 ? '⚠️ Beaucoup de commandes en attente, vérifiez le traitement !' : '✅ Les commandes sont gérées'}`;
  }

  // === Devis ===
  if (lower.includes('devis')) {
    const pending = quotes.filter(q => q.status === 'brouillon' || q.status === 'envoyé');
    const converted = quotes.filter(q => q.status === 'accepté');
    const conversionRate = quotes.length > 0 ? Math.round((converted.length / quotes.length) * 100) : 0;
    return `📄 **Analyse des Devis**\n\n📝 ${quotes.length} devis au total\n⏳ ${pending.length} en attente\n✅ ${converted.length} acceptés\n📈 Taux de conversion: **${conversionRate}%**\n\n${conversionRate < 30 ? '💡 Améliorez la présentation de vos devis !' : '✅ Bon taux de conversion'}`;
  }

  // === Conseils ===
  if (lower.includes('conseil') || lower.includes('suggère') || lower.includes('recommande') || lower.includes('aide')) {
    const lowStock = products.filter(p => p.stock <= p.minStock);
    const overdue = invoices.filter(i => i.status === 'en_retard');
    const pendingQuotes = quotes.filter(q => q.status === 'brouillon' || q.status === 'envoyé');

    let tips = '💡 **Recommandations智能**\n\n';

    if (lowStock.length > 0) tips += `🔴 **Urgent:** Réapprovisionner ${lowStock.length} produits\n`;
    if (overdue.length > 0) tips += `🚨 **Important:** Relancer ${overdue.length} factures en retard\n`;
    if (pendingQuotes.length > 3) tips += `📝 **Opportunité:** ${pendingQuotes.length} devis en attente de réponse\n`;

    tips += '\n📊 **Conseils généraux:**\n';
    tips += '• Suivez vos stocks régulièrement\n';
    tips += '• Relancez les impayés sous 7 jours\n';
    tips += '• Suivez vos devis envoyés\n';
    tips += '• Analysez vos meilleurs clients';

    return tips;
  }

  // === Salutation ===
  if (lower.includes('bonjour') || lower.includes('salut') || lower.includes('hello') || lower.includes('coucou')) {
    return '👋 Bonjour ! Je suis votre assistant IA pour TRADE LINK.\n\nJe peux vous aider avec:\n• 📊 Vos ventes et chiffre d\'affaires\n• 📦 L\'état de vos stocks\n• 👥 L\'analyse de vos clients\n• 🧾 Vos factures et impayés\n• 📋 Vos commandes\n• 📄 Vos devis\n• 💡 Des conseils et recommandations\n\nQue voulez-vous savoir ?';
  }

  // === Merci ===
  if (lower.includes('merci') || lower.includes('thanks')) {
    return '🙏 De rien ! N\'hésitez pas si vous avez d\'autres questions. Je suis là pour vous aider à gérer votre business !';
  }

  return null; // Pas de réponse locale, faut appeler l'API
}

// ============================================
// 🚀 Fonction principale de l'agent
// ============================================
export const aiAgent = {
  /**
   * Poser une question à l'agent IA
   */
  async ask(question: string): Promise<string> {
    // D'abord essayer l'analyse locale (rapide, gratuit)
    const localResponse = analyzeLocally(question);
    if (localResponse) {
      conversationHistory.push({ role: 'user', content: question });
      conversationHistory.push({ role: 'assistant', content: localResponse });
      if (conversationHistory.length > MAX_HISTORY) conversationHistory = conversationHistory.slice(-MAX_HISTORY);
      return localResponse;
    }

    // Si pas de réponse locale, appeler OpenAI
    const apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      // Mode dégradé sans API
      const context = getBusinessContext();
      return `🤖 **Mode hors-ligne** (API OpenAI non configurée)\n\nVoici le contexte actuel:\n${context}\n\n💡 Pour activer l'IA complète, ajoutez \`VITE_OPENAI_API_KEY\` dans vos variables d'environnement.`;
    }

    // Appel OpenAI
    conversationHistory.push({ role: 'user', content: question });
    const context = getBusinessContext();
    
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT + '\n\n' + context },
      ...conversationHistory.slice(-MAX_HISTORY),
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || 'Désolé, je n\'ai pas pu traiter votre demande.';
      
      conversationHistory.push({ role: 'assistant', content: answer });
      if (conversationHistory.length > MAX_HISTORY) conversationHistory = conversationHistory.slice(-MAX_HISTORY);
      
      return answer;
    } catch (error) {
      return '❌ Erreur de connexion à l\'API IA. Vérifiez votre connexion internet.';
    }
  },

  /**
   * Obtenir des suggestions rapides
   */
  getSuggestions(): string[] {
    const products = productStorage.getAll();
    const invoices = invoiceStorage.getAll();
    const lowStock = products.filter(p => p.stock <= p.minStock);
    const overdue = invoices.filter(i => i.status === 'en_retard');
    
    const suggestions: string[] = [];
    
    if (lowStock.length > 0) suggestions.push(`📦 ${lowStock.length} produits en stock bas`);
    if (overdue.length > 0) suggestions.push(`🚨 ${overdue.length} factures en retard`);
    suggestions.push('📊 Résumé des ventes');
    suggestions.push('💡 Donnez-moi des conseils');
    suggestions.push('👥 Analyse de mes clients');
    
    return suggestions;
  },

  /**
   * Réinitialiser la conversation
   */
  clearHistory(): void {
    conversationHistory = [];
  },

  /**
   * Obtenir l'historique
   */
  getHistory(): ChatMessage[] {
    return conversationHistory;
  },
};

export default aiAgent;
