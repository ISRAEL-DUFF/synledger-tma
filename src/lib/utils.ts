import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = '$') {
  const absAmount = Math.abs(amount);

  const format = (value: number, suffix: string) => {
    const formatted = value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
    return `${currency}${formatted}${suffix}`;
  };

  if (absAmount >= 1e12) return format(amount / 1e12, 't');
  if (absAmount >= 1e9) return format(amount / 1e9, 'b');
  if (absAmount >= 1e6) return format(amount / 1e6, 'm');
  if (absAmount >= 1e3) return format(amount / 1e3, 'k');

  return `${currency}${amount.toFixed(2)}`;
}

