import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getChatWebSocketUrl(userId: number) {
  const baseUrl = import.meta.env.VITE_CHAT_WS_URL || window.location.origin.replace(/^http/, 'ws');
  return `${baseUrl}?userId=${userId}`;
}
