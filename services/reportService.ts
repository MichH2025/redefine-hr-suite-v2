
import { TimeEntry } from '../types';

export const exportTimeEntriesToCSV = (entries: TimeEntry[], userName: string) => {
  if (entries.length === 0) return;

  // CSV Header
  const headers = ['Datum', 'Startzeit', 'Endzeit', 'Dauer (h)'];
  
  // Datenzeilen
  const rows = entries.map(entry => [
    entry.date,
    entry.startTime,
    entry.endTime || '-',
    entry.duration?.toFixed(2).replace('.', ',') || '0,00'
  ]);

  // CSV Inhalt zusammenbauen
  const csvContent = [
    ['Bericht für:', userName],
    ['Erstellt am:', new Date().toLocaleDateString('de-DE')],
    [],
    headers,
    ...rows
  ].map(e => e.join(';')).join('\n');

  // Download-Link erstellen
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Arbeitszeiten_${userName}_${new Date().getMonth() + 1}_${new Date().getFullYear()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
