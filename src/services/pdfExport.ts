import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, DeliveryNote } from '../types';
import { drawCompanyHeader, drawCompanyFooter } from './pdfCompany';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MAD',
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR');
};

export const exportInvoiceToPDF = (invoice: Invoice) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // En-tête
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('FACTURE', 14, 25);

  // Bloc entreprise (Paramètres → Paramétrage de l'entreprise)
  drawCompanyHeader(doc);

  // Informations de la facture
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  doc.text(`Facture #: ${invoice.id.slice(0, 8).toUpperCase()}`, 14, 35);
  doc.text(`Date: ${formatDate(invoice.createdAt)}`, 14, 42);
  doc.text(`Échéance: ${formatDate(invoice.dueDate)}`, 14, 49);

  // Statut avec couleur
  const statusColors: Record<string, [number, number, number]> = {
    'payée': [22, 163, 74],
    'envoyée': [37, 99, 235],
    'brouillon': [107, 114, 128],
    'annulée': [220, 38, 38],
  };
  const statusColor = statusColors[invoice.status] || [100, 100, 100];
  doc.setTextColor(...statusColor);
  doc.setFont('helvetica', 'bold');
  doc.text(`Statut: ${invoice.status.toUpperCase()}`, 14, 56);

  // Ligne de séparation
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(14, 62, pageWidth - 14, 62);

  // Informations client
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Client', 14, 72);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(invoice.clientName, 14, 79);

  // Tableau des produits
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Détails', 14, 95);

  const tableData = invoice.items.map(item => [
    item.productName,
    item.quantity.toString(),
    formatCurrency(item.unitPrice),
    formatCurrency(item.total),
  ]);

  autoTable(doc, {
    startY: 100,
    head: [['Produit', 'Qté', 'Prix unitaire', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    styles: {
      fontSize: 9,
      cellPadding: 5,
    },
  });

  // Totaux
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);

  doc.text('Sous-total:', pageWidth - 70, finalY);
  doc.text(formatCurrency(invoice.subtotal), pageWidth - 20, finalY, { align: 'right' });

  doc.text(`TVA (${invoice.taxRate}%):`, pageWidth - 70, finalY + 8);
  doc.text(formatCurrency(invoice.tax), pageWidth - 20, finalY + 8, { align: 'right' });

  // Ligne de séparation totaux
  doc.setDrawColor(229, 231, 235);
  doc.line(pageWidth - 80, finalY + 12, pageWidth - 14, finalY + 12);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('TOTAL:', pageWidth - 70, finalY + 22);
  doc.text(formatCurrency(invoice.total), pageWidth - 20, finalY + 22, { align: 'right' });

  // Pied de page (entreprise + identifiants fiscaux)
  drawCompanyFooter(doc);

  // Sauvegarder
  doc.save(`facture-${invoice.id.slice(0, 8)}.pdf`);
};

export const exportDeliveryToPDF = (delivery: DeliveryNote) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // En-tête
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('BON DE LIVRAISON', 14, 25);

  // Bloc entreprise (Paramètres → Paramétrage de l'entreprise)
  drawCompanyHeader(doc);

  // Informations du bon
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  doc.text(`Bon #: ${delivery.id.slice(0, 8).toUpperCase()}`, 14, 35);
  doc.text(`Client: ${delivery.clientName}`, 14, 42);
  doc.text(`Date: ${formatDate(delivery.deliveryDate)}`, 14, 49);
  doc.text(`Statut: ${delivery.status.replace('_', ' ')}`, 14, 56);

  // Ligne de séparation
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(14, 62, pageWidth - 14, 62);

  // Tableau des produits
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Articles', 14, 72);

  const tableData = delivery.items.map(item => [
    item.productName,
    item.quantity.toString(),
    formatCurrency(item.delivered > 0 ? item.delivered : item.quantity), // qté livrée ou totale
    item.unit,
  ]);

  autoTable(doc, {
    startY: 72,
    head: [['Produit', 'Qté', 'Qté livrée', 'Unité']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    styles: {
      fontSize: 8,
      cellPadding: 4,
    },
  });

  // Totaux
  const totalExpected = delivery.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalDelivered = delivery.items.reduce((sum, item) => sum + item.delivered, 0);
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);

  doc.text('Total attendu:', pageWidth - 70, finalY);
  doc.text(String(totalExpected), pageWidth - 20, finalY, { align: 'right' });

  doc.text('Total livré:', pageWidth - 70, finalY + 8);
  doc.text(String(totalDelivered), pageWidth - 20, finalY + 8, { align: 'right' });

  // Ligne de séparation totaux
  doc.setDrawColor(229, 231, 235);
  doc.line(pageWidth - 80, finalY + 12, pageWidth - 14, finalY + 12);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('Chauffeur:', 14, finalY + 20);
  doc.text(delivery.driverName || '-', pageWidth - 20, finalY + 20, { align: 'right' });

  // Pied de page (entreprise + identifiants fiscaux)
  drawCompanyFooter(doc);

  // Sauvegarder
  doc.save(`bon-livraison-${delivery.id.slice(0, 8)}.pdf`);
};

export const exportAllInvoicesToPDF = (invoices: Invoice[]) => {
  const doc = new jsPDF('landscape');

  // En-tête
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('RÉCAPITULATIF DES FACTURES', 14, 20);

  // Bloc entreprise (Paramètres → Paramétrage de l'entreprise)
  drawCompanyHeader(doc);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`Exporté le ${formatDate(new Date().toISOString())}`, 14, 28);

  // Statistiques rapides
  const totalVentes = invoices.filter(i => i.status === 'payée').reduce((sum, i) => sum + i.total, 0);
  const facturesEnAttente = invoices.filter(i => i.status === 'envoyée').length;
  const facturesPayees = invoices.filter(i => i.status === 'payée').length;

  doc.setFontSize(10);
  doc.text(`Total ventes payées: ${formatCurrency(totalVentes)}`, 14, 36);
  doc.text(`Factures payées: ${facturesPayees}`, 14, 42);
  doc.text(`Factures en attente: ${facturesEnAttente}`, 14, 48);

  // Tableau
  const tableData = invoices.map(invoice => [
    invoice.id.slice(0, 8).toUpperCase(),
    invoice.clientName,
    formatDate(invoice.createdAt),
    formatCurrency(invoice.subtotal),
    `${invoice.taxRate}%`,
    formatCurrency(invoice.total),
    invoice.status.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: 55,
    head: [['#Facture', 'Client', 'Date', 'Sous-total', 'TVA', 'Total', 'Statut']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    styles: {
      fontSize: 8,
      cellPadding: 4,
    },
  });

  // Pied de page (entreprise + identifiants fiscaux)
  drawCompanyFooter(doc);

  doc.save(`recapitulatif-factures-${formatDate(new Date().toISOString())}.pdf`);
};
