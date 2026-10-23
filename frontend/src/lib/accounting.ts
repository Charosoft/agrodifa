import type { TxType } from '../types/database'

// Catégories proposées à la saisie manuelle (la base accepte n'importe quel texte).
export const CATEGORIES: Record<TxType, { value: string; label: string }[]> = {
  income: [
    { value: 'vente', label: 'Vente en boutique' },
    { value: 'apport', label: 'Apport / capital' },
    { value: 'autre', label: 'Autre entrée' },
  ],
  expense: [
    { value: 'achat', label: 'Achat (marchandises, aliments)' },
    { value: 'transport', label: 'Transport' },
    { value: 'loyer', label: 'Loyer' },
    { value: 'energie', label: 'Électricité / eau' },
    { value: 'reparation', label: 'Réparation / entretien' },
    { value: 'autre', label: 'Autre dépense' },
  ],
}

// Libellés de toutes les catégories, y compris celles créées automatiquement.
const ALL_LABELS: Record<string, string> = {
  vente: 'Vente',
  apport: 'Apport / capital',
  achat: 'Achat',
  transport: 'Transport',
  loyer: 'Loyer',
  energie: 'Électricité / eau',
  reparation: 'Réparation',
  salaire: 'Salaires',
  avance: 'Avances',
  prime: 'Primes',
  autre: 'Autre',
}

export function categoryLabel(value: string): string {
  return ALL_LABELS[value] ?? value
}