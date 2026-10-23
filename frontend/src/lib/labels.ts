import type { OrderStatus, PayMethod, PaymentKind } from '../types/database'

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-brand-100 text-brand-800',
  delivered: 'bg-leaf-100 text-leaf-700',
  cancelled: 'bg-slate-200 text-slate-600',
}

export const PAY_LABELS: Record<PayMethod, string> = {
  cash: 'Espèces',
  mpesa: 'M-Pesa',
  airtel_money: 'Airtel Money',
  orange_money: 'Orange Money',
  bank: 'Banque',
  other: 'Autre',
}

export const KIND_LABELS: Record<PaymentKind, string> = {
  salary: 'Salaire',
  advance: 'Avance',
  bonus: 'Prime',
}