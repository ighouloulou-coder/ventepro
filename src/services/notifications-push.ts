// Notification Service - Push Notifications pour nouvelles commandes

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

export function sendLocalNotification(title: string, body: string, url?: string) {
  if (Notification.permission !== 'granted') return;
  const notification = new Notification(title, {
    body,
    icon: '/icon-192.svg',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    tag: 'tradelink-' + Date.now(),
  });
  if (url) {
    notification.onclick = () => {
      window.focus();
      window.location.href = url;
    };
  }
}

// Notify when a new order is created
export function notifyNewOrder(clientName: string, amount: string) {
  sendLocalNotification(
    '📋 Nouvelle Commande',
    `Commande de ${clientName} - ${amount}`,
    '/orders'
  );
}

// Notify when a new invoice is created
export function notifyNewInvoice(clientName: string, amount: string) {
  sendLocalNotification(
    '🧾 Nouvelle Facture',
    `Facture pour ${clientName} - ${amount}`,
    '/invoices'
  );
}

// Notify when a payment is received
export function notifyPayment(invoiceId: string, amount: string) {
  sendLocalNotification(
    '💰 Paiement Reçu',
    `Paiement de ${amount} pour facture #${invoiceId}`,
    '/invoices'
  );
}

// Notify when stock is low
export function notifyLowStock(productName: string, stock: number) {
  sendLocalNotification(
    '⚠️ Stock Bas',
    `${productName} - il ne reste que ${stock} unités`,
    '/products'
  );
}

// Notify when a delivery is scheduled
export function notifyDelivery(clientName: string, date: string) {
  sendLocalNotification(
    '🚚 Livraison Planifiée',
    `Livraison pour ${clientName} le ${date}`,
    '/deliveries'
  );
}
