// Format currency in Brazilian Real
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Format date in Brazilian format
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

// Format date and time
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

// Format time only
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

// Format phone for display
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 13) {
    // +55 11 99999-0001
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  }
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

// Clean phone number for storage (keep only digits with country code)
export function cleanPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  // Add Brazil country code if not present
  if (cleaned.length === 11) {
    cleaned = '55' + cleaned;
  }
  if (cleaned.length === 10) {
    cleaned = '55' + cleaned;
  }
  return '+' + cleaned;
}

// Format plate (uppercase, handle both old and Mercosul format)
export function formatPlate(plate: string): string {
  return plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Calculate time elapsed
export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 30) return `${diffDays} dias`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses`;
  return `${Math.floor(diffDays / 365)} anos`;
}

// Calculate time elapsed in detail (for wash duration)
export function timeDuration(startDate: Date | string): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) return `${mins}min`;
  return `${hours}h${mins > 0 ? `${mins}min` : ''}`;
}

// Days since date
export function daysSince(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

// Status labels in Portuguese
export const STATUS_LABELS: Record<string, string> = {
  WAITING: 'Aguardando',
  IN_SERVICE: 'Em Serviço',
  READY: 'Pronto',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

// Status colors
export const STATUS_COLORS: Record<string, string> = {
  WAITING: 'var(--color-warning)',
  IN_SERVICE: 'var(--color-info)',
  READY: 'var(--color-success)',
  DELIVERED: 'var(--color-purple)',
  CANCELLED: 'var(--color-danger)',
};

// Debounce helper
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Generate WhatsApp link (Detects Mobile vs Desktop for seamless opening)
export function whatsappLink(phone: string, message?: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 || cleaned.length === 10) {
    cleaned = '55' + cleaned;
  }
  const encodedText = message ? encodeURIComponent(message) : '';

  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);

  if (isMobile) {
    return `https://wa.me/${cleaned}${encodedText ? `?text=${encodedText}` : ''}`;
  }

  // On Desktop: web.whatsapp.com opens directly in browser tab without OS app prompt
  return `https://web.whatsapp.com/send?phone=${cleaned}${encodedText ? `&text=${encodedText}` : ''}`;
}

// Build ready message from template
export function buildReadyMessage(
  template: string | null | undefined,
  customerName: string,
  vehicleModel: string,
  vehiclePlate: string
): string {
  const defaultTemplate =
    'Olá, {nome}! 🚗✨\n\nSeu {modelo} — placa {placa} — ficou pronto e já está disponível para retirada.\n\nObrigado por confiar em nosso lava-rápido! 🚿';
  const tpl = template || defaultTemplate;
  return tpl
    .replace(/{nome}/g, customerName)
    .replace(/{modelo}/g, vehicleModel)
    .replace(/{placa}/g, vehiclePlate);
}

// Open WhatsApp directly without async delay
export function openWhatsAppDirect(phone: string, message?: string) {
  const url = whatsappLink(phone, message);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

// CN helper for conditional classnames
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
