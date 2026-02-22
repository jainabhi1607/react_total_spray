import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import CryptoJS from "crypto-js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ENCRYPTION_KEY = process.env.JWT_SECRET || "tsc-default-key";

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(cipherText: string): string {
  const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function generateAccessToken(): string {
  return CryptoJS.lib.WordArray.random(32).toString();
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount);
}

export const ROLES = {
  SUPER_ADMIN: 1,
  SUB_ADMIN: 2,
  ADMIN: 3,
  CLIENT_ADMIN: 4,
  CLIENT_USER: 6,
  TECHNICIAN_COMPANY: 7,
  TECHNICIAN_USER: 9,
} as const;

export const ROLE_LABELS: Record<number, string> = {
  1: "Super Admin",
  2: "Sub Admin",
  3: "Admin",
  4: "Client Admin",
  6: "Client User",
  7: "Technician Company",
  9: "Technician User",
};

export const STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
  DELETED: 2,
  PENDING: 25,
} as const;

export const TICKET_STATUS = {
  OPEN: 1,
  IN_PROGRESS: 2,
  ON_HOLD: 3,
  RESOLVED: 4,
  CLOSED: 5,
  TO_INVOICE: 6,
} as const;

export const TICKET_STATUS_LABELS: Record<number, string> = {
  1: "Open",
  2: "In Progress",
  3: "On Hold",
  4: "Resolved",
  5: "Closed",
  6: "To Invoice",
};

export const JOB_CARD_STATUS = {
  DRAFT: 0,
  OPEN: 1,
  IN_PROGRESS: 2,
  COMPLETED: 3,
  CANCELLED: 4,
} as const;

export const JOB_CARD_STATUS_LABELS: Record<number, string> = {
  0: "Draft",
  1: "Open",
  2: "In Progress",
  3: "Completed",
  4: "Cancelled",
};

export function isAdmin(role: number): boolean {
  return [ROLES.SUPER_ADMIN, ROLES.SUB_ADMIN, ROLES.ADMIN].includes(role as any);
}

export function isSuperAdmin(role: number): boolean {
  return role === ROLES.SUPER_ADMIN;
}

export function isClientUser(role: number): boolean {
  return [ROLES.CLIENT_ADMIN, ROLES.CLIENT_USER].includes(role as any);
}

export function isTechnician(role: number): boolean {
  return [ROLES.TECHNICIAN_COMPANY, ROLES.TECHNICIAN_USER].includes(role as any);
}

export function getStatusBadgeColor(status: number): string {
  switch (status) {
    case 1: return "bg-green-100 text-green-800";
    case 2: return "bg-blue-100 text-blue-800";
    case 3: return "bg-yellow-100 text-yellow-800";
    case 4: return "bg-purple-100 text-purple-800";
    case 5: return "bg-gray-100 text-gray-800";
    case 6: return "bg-orange-100 text-orange-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + "...";
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
