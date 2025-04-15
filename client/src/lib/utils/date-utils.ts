import { format, formatDistance, formatRelative } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Format a date using date-fns with PT-BR locale
 * @param date Date string, Date object or timestamp
 * @param formatString Format string according to date-fns
 * @returns Formatted date string
 */
export function formatDate(date: string | number | Date, formatString: string): string {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
      
    return format(dateObj, formatString, { locale: ptBR });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Format the relative time from now (e.g., "2 days ago")
 * @param date Date string, Date object or timestamp
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | number | Date): string {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
      
    return formatDistance(dateObj, new Date(), { 
      addSuffix: true, 
      locale: ptBR 
    });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid Date';
  }
}

/**
 * Format a date relative to another date
 * @param date Date to format
 * @param baseDate Base date for comparison
 * @returns Formatted relative date string
 */
export function formatRelativeDate(
  date: string | number | Date, 
  baseDate: string | number | Date = new Date()
): string {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
      
    const baseDateObj = typeof baseDate === 'string' || typeof baseDate === 'number' 
      ? new Date(baseDate) 
      : baseDate;
      
    return formatRelative(dateObj, baseDateObj, { locale: ptBR });
  } catch (error) {
    console.error('Error formatting relative date:', error);
    return 'Invalid Date';
  }
}

/**
 * Format a time range from start and end dates
 * @param startDate Start date
 * @param endDate End date
 * @returns Formatted time range string (e.g., "09:00 - 10:30")
 */
export function formatTimeRange(
  startDate: string | number | Date,
  endDate: string | number | Date
): string {
  try {
    const startDateObj = typeof startDate === 'string' || typeof startDate === 'number' 
      ? new Date(startDate) 
      : startDate;
      
    const endDateObj = typeof endDate === 'string' || typeof endDate === 'number' 
      ? new Date(endDate) 
      : endDate;
      
    return `${format(startDateObj, 'HH:mm')} - ${format(endDateObj, 'HH:mm')}`;
  } catch (error) {
    console.error('Error formatting time range:', error);
    return 'Invalid Time Range';
  }
}

/**
 * Get a date object for the start of a day
 * @param date Date to get start of day for
 * @returns Date object set to start of day
 */
export function getStartOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

/**
 * Get a date object for the end of a day
 * @param date Date to get end of day for
 * @returns Date object set to end of day
 */
export function getEndOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}
