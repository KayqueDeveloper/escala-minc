import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return `${formatDate(d)} • ${formatTime(d)}`;
}

export function getDayName(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long'
  });
}

export function getWeekday(dayOfWeek: number): string {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[dayOfWeek];
}

// Convert HH:MM format to minutes for easier comparison
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Convert minutes back to HH:MM format
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Check if two time ranges overlap
export function hasTimeOverlap(
  start1: string, 
  end1: string, 
  start2: string, 
  end2: string
): boolean {
  const start1Mins = timeToMinutes(start1);
  const end1Mins = timeToMinutes(end1);
  const start2Mins = timeToMinutes(start2);
  const end2Mins = timeToMinutes(end2);
  
  return !(end1Mins <= start2Mins || start1Mins >= end2Mins);
}

// Generate timeSlots for select fields
export function generateTimeSlots(interval: number = 30): string[] {
  const slots: string[] = [];
  const totalMinutes = 24 * 60;
  
  for (let i = 0; i < totalMinutes; i += interval) {
    slots.push(minutesToTime(i));
  }
  
  return slots;
}

// Helper to generate avatar URL if custom avatar is not available
export function getAvatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3f51b5&color=fff`;
}
