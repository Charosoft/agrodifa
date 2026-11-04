import type { PaymentKind, TxType } from '../types/database'
import { errMsg } from './errors'
import { monthLabel } from './period'

// Catégories (« motifs ») proposées à la saisie. La base accepte n'importe quel texte.
export const CATEGORIES: Record<TxType, { value: string; label: string }[]> = {
  income: [
    { value: 'vente', label: 'Vente en boutique' },
    { value: 'apport', label: 'Apport / capital' },
    { value: 'autre', label: 'Autre entrée' },
  ],
  expense: [
    { value: 'salaire', label: 'Salaire du personnel' },
    { value: 'avance', label: 'Avance sur salaire' },
    { value: 'prime', label: 'Prime' },
    { value: 'transport_agent', label: 'Transport d\'un agent' },
    { value: 'achat', label: 'Achat (marchandises, aliments)' },
    { value: 'transport', label: 'Transport (marchandises, livraison)' },
    { value: 'loyer', label: 'Loyer' },
    { value: 'energie', label: 'Électricité / eau' },
    { value: 'reparation', label: 'Réparation / entretien' },
    { value: 'autre', label: 'Autre dépense' },
  ],
}

// Les motifs qui concernent un employé passent par les paiements du personnel :
// un seul salaire par mois, historique complet, bénéficiaire obligatoire.
export const STAFF_MOTIFS: Record<string, PaymentKind> = {
  salaire: 'salary',
  avance: 'advance',
  prime: 'bonus',
  transport_agent: 'transport',
}

// Libellés de toutes les catégories, y compris celles créées automatiquement.
const ALL_LABELS: Record<string, string> = {
  vente: 'Vente',
  apport: 'Apport / capital',
  achat: 'Achat',
  transport: 'Transport',
  transport_agent: 'Transport d\'un agent',
  loyer: 'Loyer',
  energie: 'Électricité / eau',
  reparation: 'Réparation',
  salaire: 'Salaire',
  avance: 'Avance',
  prime: 'Prime',
  autre: 'Autre',
}

export function categoryLabel(value: string): string {
  return ALL_LABELS[value] ?? value
}

// Message clair quand la base refuse un deuxième salaire pour le même mois
export function friendlyPaymentError(error: unknown, who: string, period: string): string {
  const code = (error as { code?: string } | null)?.code
  if (code === '23505') {
    return `Le salaire de ${monthLabel(period)} est déjà payé pour ${who}. Il ne peut être enregistré qu'une seule fois par mois.`
  }
  return errMsg(error)
}