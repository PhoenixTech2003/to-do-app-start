import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ClassValue } from 'clsx'

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

export function truncateText(text: string | undefined, max = 50): string {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max)}...` : text
}
