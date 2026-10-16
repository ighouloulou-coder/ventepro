// Test de la possibilité de modifier les prix lors du transfert BL→facture
// On va simuler la sélection d'une facture modifiée avec des prix différents
const invoices = JSON.parse(localStorage.getItem('tradelink_invoices') || '[]');
const lastInvoice = invoices[invoices.length - 1];
if (!lastInvoice) {
  console.log('Aucune facture existante');
  process.exit(0);
}
console.log('Dernière facture :', JSON.stringify(lastInvoice, null, 2).slice(0, 500));
console.log('Items :', lastInvoice.items.map(i => ({
  productName: i.productName,
  quantity: i.quantity,
  unitPrice: i.unitPrice,
  total: i.total,
})));