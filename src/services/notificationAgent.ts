// ============================================
// 🔔 Agent de Notifications Automatiques
// ============================================
import { productStorage, clientStorage, invoiceStorage, orderStorage } from './storage';
import { supplierStorage } from './supplierStorage';

export interface Notification {
  id: string;
  type: 'warning' | 'danger' | 'success' | 'info';
  icon: string;
  title: string;
  message: string;
  action?: { label: string; path: string };
  timestamp: Date;
  read: boolean;
}

// ============================================
// 📦 Vérification des stocks
// ============================================
function checkStockAlerts(): Notification[] {
  const products = productStorage.getAll();
  const notifications: Notification[] = [];

  // Produits en rupture de stock
  const outOfStock = products.filter(p => p.stock === 0);
  outOfStock.forEach(p => {
    notifications.push({
      id: `stock-zero-${p.id}`,
      type: 'danger',
      icon: '🔴',
      title: 'Rupture de stock',
      message: `${p.name} est en rupture de stock !`,
      action: { label: 'Voir le produit', path: '/products' },
      timestamp: new Date(),
      read: false,
    });
  });

  // Produits en stock bas
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock);
  lowStock.forEach(p => {
    notifications.push({
      id: `stock-low-${p.id}`,
      type: 'warning',
      icon: '⚠️',
      title: 'Stock bas',
      message: `${p.name} : ${p.stock} restants (min: ${p.minStock})`,
      action: { label: 'Voir le produit', path: '/products' },
      timestamp: new Date(),
      read: false,
    });
  });

  return notifications;
}

// ============================================
// 🧾 Vérification des factures
// ============================================
function checkInvoiceAlerts(): Notification[] {
  const invoices = invoiceStorage.getAll();
  const notifications: Notification[] = [];

  const now = new Date();
  
  // Factures en retard
  const overdue = invoices.filter(i => i.status === 'en_retard' || 
    (i.status !== 'payée' && i.status !== 'annulée' && new Date(i.dueDate) < now));
  
  overdue.forEach(inv => {
    const daysOverdue = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    notifications.push({
      id: `overdue-${inv.id}`,
      type: 'danger',
      icon: '🚨',
      title: 'Facture en retard',
      message: `Facture #${inv.id.slice(0, 6)} - ${inv.total} MAD - ${daysOverdue} jour(s) de retard`,
      action: { label: 'Voir les factures', path: '/invoices' },
      timestamp: new Date(),
      read: false,
    });
  });

  // Factures échéance proche (7 jours)
  const upcoming = invoices.filter(i => {
    if (i.status === 'payée' || i.status === 'annulée') return false;
    const dueDate = new Date(i.dueDate);
    const diff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 7;
  });

  upcoming.forEach(inv => {
    notifications.push({
      id: `upcoming-${inv.id}`,
      type: 'warning',
      icon: '⏰',
      title: 'Échéance proche',
      message: `Facture #${inv.id.slice(0, 6)} - ${inv.total} MAD - échéance dans ${Math.ceil((new Date(inv.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} jours`,
      action: { label: 'Voir les factures', path: '/invoices' },
      timestamp: new Date(),
      read: false,
    });
  });

  return notifications;
}

// ============================================
// 📋 Vérification des commandes
// ============================================
function checkOrderAlerts(): Notification[] {
  const orders = orderStorage.getAll();
  const notifications: Notification[] = [];

  // Commandes en attente depuis > 7 jours
  const oldPending = orders.filter(o => {
    if (o.status !== 'en_attente' && o.status !== 'confirmée') return false;
    const created = new Date(o.createdAt);
    const diff = (new Date().getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 7;
  });

  if (oldPending.length > 0) {
    notifications.push({
      id: 'old-orders',
      type: 'warning',
      icon: '📋',
      title: 'Commandes anciennes',
      message: `${oldPending.length} commande(s) en attente depuis plus de 7 jours`,
      action: { label: 'Voir les commandes', path: '/orders' },
      timestamp: new Date(),
      read: false,
    });
  }

  return notifications;
}

// ============================================
// 🏭 Vérification des fournisseurs
// ============================================
function checkSupplierAlerts(): Notification[] {
  const suppliers = supplierStorage.getAll();
  const notifications: Notification[] = [];

  // Fournisseurs avec rating bas
  const lowRated = suppliers.filter(s => {
    if (s.ratings.length === 0) return false;
    const avg = s.ratings.reduce((sum, r) => sum + (r.quality + r.delivery + r.price + r.service) / 4, 0) / s.ratings.length;
    return avg < 3;
  });

  lowRated.forEach(s => {
    notifications.push({
      id: `supplier-low-${s.id}`,
      type: 'info',
      icon: '🏭',
      title: 'Fournisseur à surveiller',
      message: `${s.name} a un rating faible`,
      action: { label: 'Voir les fournisseurs', path: '/suppliers' },
      timestamp: new Date(),
      read: false,
    });
  });

  return notifications;
}

// ============================================
// 🚀 Agent principal
// ============================================
const NOTIFICATION_KEY = 'tradelink_notifications';
let checkInterval: NodeJS.Timeout | null = null;

export const notificationAgent = {
  /**
   * Lancer la surveillance automatique
   */
  start(intervalMs: number = 60000): void {
    if (checkInterval) clearInterval(checkInterval);
    
    // Vérifier immédiatement
    this.check();
    
    // Puis intervalle régulier
    checkInterval = setInterval(() => this.check(), intervalMs);
    console.log('🔔 Agent de notifications démarré (intervalle:', intervalMs, 'ms)');
  },

  /**
   * Arrêter la surveillance
   */
  stop(): void {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  },

  /**
   * Vérifier toutes les alertes
   */
  check(): Notification[] {
    const notifications: Notification[] = [
      ...checkStockAlerts(),
      ...checkInvoiceAlerts(),
      ...checkOrderAlerts(),
      ...checkSupplierAlerts(),
    ];

    // Sauvegarder les notifications
    if (notifications.length > 0) {
      const existing = this.getNotifications();
      const existingIds = new Set(existing.map(n => n.id));
      const newNotifications = notifications.filter(n => !existingIds.has(n.id));
      
      if (newNotifications.length > 0) {
        const all = [...newNotifications, ...existing].slice(0, 50);
        localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(all));
        
        // Dispatch event pour mettre à jour l'UI
        window.dispatchEvent(new CustomEvent('notifications-update', { 
          detail: { count: all.filter(n => !n.read).length } 
        }));
      }
    }

    return notifications;
  },

  /**
   * Obtenir toutes les notifications
   */
  getNotifications(): Notification[] {
    try {
      const data = localStorage.getItem(NOTIFICATION_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Obtenir le nombre de non-lues
   */
  getUnreadCount(): number {
    return this.getNotifications().filter(n => !n.read).length;
  },

  /**
   * Marquer comme lu
   */
  markAsRead(id: string): void {
    const notifications = this.getNotifications();
    const idx = notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      notifications[idx].read = true;
      localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notifications));
      window.dispatchEvent(new CustomEvent('notifications-update', { 
        detail: { count: notifications.filter(n => !n.read).length } 
      }));
    }
  },

  /**
   * Tout marquer comme lu
   */
  markAllAsRead(): void {
    const notifications = this.getNotifications().map(n => ({ ...n, read: true }));
    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notifications));
    window.dispatchEvent(new CustomEvent('notifications-update', { detail: { count: 0 } }));
  },

  /**
   * Supprimer une notification
   */
  dismiss(id: string): void {
    const notifications = this.getNotifications().filter(n => n.id !== id);
    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notifications));
    window.dispatchEvent(new CustomEvent('notifications-update', { 
      detail: { count: notifications.filter(n => !n.read).length } 
    }));
  },
};

export default notificationAgent;
