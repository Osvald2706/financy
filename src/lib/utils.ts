import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, isPast, isToday, isTomorrow, addDays } from "date-fns"
import { es } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "MXN"): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string, pattern = "PPP"): string {
  return format(new Date(date), pattern, { locale: es })
}

export function formatDateShort(date: Date | string): string {
  return format(new Date(date), "dd/MM/yyyy", { locale: es })
}

export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

export function getDueDateStatus(dueDate: Date | string | null): {
  label: string
  variant: "success" | "warning" | "destructive" | "default"
} {
  if (!dueDate) return { label: "Sin fecha", variant: "default" }
  const date = new Date(dueDate)
  if (isPast(date)) return { label: "Vencida", variant: "destructive" }
  if (isToday(date)) return { label: "Vence hoy", variant: "warning" }
  if (isTomorrow(date)) return { label: "Vence mañana", variant: "warning" }
  if (date <= addDays(new Date(), 7)) return { label: "Próximo 7 días", variant: "warning" }
  return { label: formatDate(date, "dd MMM"), variant: "success" }
}

export function calculateProgress(current: number, total: number): number {
  if (total === 0) return 0
  return Math.min(100, Math.round((current / total) * 100))
}

export function getDebtStatusColor(status: string): string {
  switch (status) {
    case "active": return "text-rose-500"
    case "paid": return "text-emerald-500"
    case "defaulted": return "text-red-600"
    case "refinanced": return "text-amber-500"
    default: return "text-muted-foreground"
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export const COLORS = {
  primary: "#10b981",
  warning: "#f59e0b",
  destructive: "#ef4444",
  info: "#3b82f6",
  purple: "#8b5cf6",
  pink: "#ec4899",
  cyan: "#06b6d4",
  orange: "#f97316",
}

export const CHART_COLORS = [
  "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b",
  "#ef4444", "#ec4899", "#06b6d4", "#f97316",
  "#84cc16", "#14b8a6", "#6366f1", "#d946ef",
]

export const CATEGORY_ICONS: Record<string, string> = {
  salary: "briefcase",
  freelance: "laptop",
  investment: "trending-up",
  rental: "home",
  gift: "gift",
  food: "utensils-crossed",
  transport: "car",
  housing: "building",
  utilities: "zap",
  entertainment: "film",
  health: "heart-pulse",
  education: "book-open",
  shopping: "shopping-bag",
  savings: "piggy-bank",
  other: "circle",
}
