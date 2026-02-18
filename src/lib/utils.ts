import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function generateShareToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  let result = "sk_";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(randomBytes[i] % chars.length);
  }
  return result;
}

export function getFleetSizeLabel(tractors: number | null): string {
  if (!tractors) return "Unknown";
  if (tractors >= 5000) return "Mega Fleet";
  if (tractors >= 1000) return "Large Fleet";
  if (tractors >= 250) return "Mid-Size Fleet";
  if (tractors >= 50) return "Small Fleet";
  return "Micro Fleet";
}

export function formatDate(date: string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
