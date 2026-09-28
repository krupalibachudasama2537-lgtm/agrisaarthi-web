import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/** Teach tailwind-merge our custom tokens so e.g. `text-eyebrow` isn't mistaken for a colour */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['3xs', '2xs', 'caption', 'body-sm', 'body', 'eyebrow', 'display-sm', 'display-md', 'display-lg', 'display-xl'] }],
      rounded: [{ rounded: ['stage', 'card', 'chip'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Pad a step number: 1 -> "01" */
export function pad2(n: number) {
  return n.toString().padStart(2, '0')
}

/** Indian-style rupee formatting: 12500 -> "₹12,500" */
export function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}
