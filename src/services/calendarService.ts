// Google Calendar Integration for Deliveries
import { deliveryStorage } from './storage';

export function generateGoogleCalendarUrl(delivery: {
  clientName: string;
  address?: string;
  deliveryDate: string;
  notes?: string;
}): string {
  const start = new Date(delivery.deliveryDate);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour
  
  const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const title = encodeURIComponent('Livraison - ' + delivery.clientName);
  const details = encodeURIComponent(
    'Client: ' + delivery.clientName +
    (delivery.address ? '\nAdresse: ' + delivery.address : '') +
    (delivery.notes ? '\nNotes: ' + delivery.notes : '')
  );
  const location = encodeURIComponent(delivery.address || '');
  
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    '&text=' + title +
    '&dates=' + formatDate(start) + '/' + formatDate(end) +
    '&details=' + details +
    '&location=' + location +
    '&sf=true&output=xml';
}

export function openDeliveryInCalendar(delivery: {
  clientName: string;
  address?: string;
  deliveryDate: string;
  notes?: string;
}) {
  const url = generateGoogleCalendarUrl(delivery);
  window.open(url, '_blank');
}

export function exportAllDeliveriesToCalendar() {
  const deliveries = deliveryStorage.getAll();
  let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//TRADE LINK//FR\n';
  deliveries.forEach(d => {
    const start = new Date(d.deliveryDate);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const fmt = (dt: Date) => dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    ics += 'BEGIN:VEVENT\n';
    ics += 'DTSTART:' + fmt(start) + '\n';
    ics += 'DTEND:' + fmt(end) + '\n';
    ics += 'SUMMARY:Livraison - ' + d.clientName + '\n';
    ics += 'DESCRIPTION:Client: ' + d.clientName + (d.notes ? '\n' + d.notes : '') + '\n';
    if (d.address) ics += 'LOCATION:' + d.address + '\n';
    ics += 'END:VEVENT\n';
  });
  ics += 'END:VCALENDAR';
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'livraisons-tradelink.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
