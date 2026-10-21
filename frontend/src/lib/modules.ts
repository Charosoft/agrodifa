import type { AppModule } from '../types/database'

// Une seule liste pour le menu, le tableau de bord et les routes.
export const ADMIN_MODULES: { module: AppModule; label: string; path: string; description: string }[] = [
  { module: 'stock', label: 'Produits & stock', path: '/admin/stock', description: 'Catalogue, prix, photos, entrées et sorties' },
  { module: 'sales', label: 'Commandes & ventes', path: '/admin/ventes', description: 'Commandes clients, statuts, messages reçus' },
  { module: 'staff', label: 'Personnel', path: '/admin/personnel', description: 'Employés et paiements' },
  { module: 'accounting', label: 'Comptabilité', path: '/admin/comptabilite', description: 'Entrées et sorties d\'argent' },
  { module: 'advertising', label: 'Publicité', path: '/admin/publicite', description: 'Carrousel et produits mis en avant' },
]
