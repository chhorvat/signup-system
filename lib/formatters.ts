import { format, parseISO } from 'date-fns';

export function formatDate(dateStr: string): string {
  try { return format(parseISO(dateStr), 'EEEE, MMMM d, yyyy'); } catch { return dateStr; }
}

export function formatDateShort(dateStr: string): string {
  try { return format(parseISO(dateStr), 'EEE, MMM d, yyyy'); } catch { return dateStr; }
}

export function formatTime(timeStr: string): string {
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(); d.setHours(h, m);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch { return timeStr; }
}
