import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isPast, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

// Tailwind class merge utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate unique ID
export function generateId(): string {
  return crypto.randomUUID();
}

// Format a Firestore Timestamp to readable date
export function formatDate(timestamp: Timestamp | null): string {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  return format(date, 'dd MMM yyyy', { locale: es });
}

// Format relative time
export function formatRelativeDate(timestamp: Timestamp | null): string {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  return formatDistanceToNow(date, { addSuffix: true, locale: es });
}

// Check if a date is overdue
export function isOverdue(timestamp: Timestamp | null): boolean {
  if (!timestamp) return false;
  const date = timestamp.toDate();
  return isPast(date) && !isToday(date);
}

// Strip markdown for preview text
export function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/!\[.*?\]\(.+?\)/g, '')
    .replace(/>\s/g, '')
    .replace(/[-*+]\s/g, '')
    .replace(/\d+\.\s/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

// Debounce utility
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
