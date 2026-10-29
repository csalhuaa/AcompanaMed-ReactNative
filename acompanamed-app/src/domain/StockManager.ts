import { Medicine } from './types';

export function decrementStock(medicine: Medicine, quantity: number = 1): Medicine {
  const newStock = Math.max(0, medicine.stock - quantity);
  return {
    ...medicine,
    stock: newStock,
  };
}

export function isStockLow(medicine: Medicine): boolean {
  return medicine.stock <= medicine.minStockAlert;
}

export function daysRemaining(stock: number, dosesPerDay: number): number {
  if (dosesPerDay <= 0) return 0;
  return Math.floor(stock / dosesPerDay);
}
