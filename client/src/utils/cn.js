import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and merges Tailwind classes using tailwind-merge.
 * This is the standard utility for conditional class composition.
 *
 * @param {...any} inputs - Class name inputs (strings, arrays, objects)
 * @returns {string} - Merged class name string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
