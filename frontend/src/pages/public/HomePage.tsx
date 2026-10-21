import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import PriceTag from '../../components/ui/PriceTag'
import { useUsdRate } from '../../hooks/useUsdRate'

// Page provisoire : sert à vérifier que Tailwind, les couleurs et Supabase fonctionnent.
export default function HomePage() {
  const rate = useUsdRate()

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold text-brand-800">Bienvenue chez AGRODIFA</h1>
        <p className="mt-2 text-slate-600">Test de la charte et du taux de change :</p>
        <div className="mt-4 inline-block rounded-xl border border-slate-200 p-4">
          <span className="mb-2 inline-block rounded-full bg-leaf-100 px-2 py-0.5 text-xs font-semibold text-leaf-700">
            Bio
          </span>
          <PriceTag cdf={25000} rate={rate} />
        </div>
      </main>
      <Footer />
    </>
  )
}
