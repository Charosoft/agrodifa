import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

interface Slide {
  id: string
  title: string
  subtitle: string | null
  image_url: string | null
  link: string | null
}

// Slide affichée tant que le propriétaire n'a ajouté aucune publicité
const DEFAULT_SLIDES: Slide[] = [
  {
    id: 'default',
    title: 'Mangez bio vous épargne de l\'hôpital…',
    subtitle: 'Des produits agro-pastoraux frais, de chez nous, à commander en quelques clics.',
    image_url: null,
    link: '/produits',
  },
]

export default function HeroCarousel() {
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    supabase
      .from('adverts')
      .select('id, title, subtitle, image_url, link')
      .eq('kind', 'carousel')
      .eq('is_active', true)
      .order('position')
      .then(({ data }) => {
        if (data && data.length > 0) setSlides(data)
      })
  }, [])

  // Changement automatique toutes les 5 secondes (sauf si le visiteur survole)
  useEffect(() => {
    if (paused || slides.length < 2) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000)
    return () => clearInterval(timer)
  }, [paused, slides.length])

  const current = index % slides.length
  const go = (i: number) => setIndex((i + slides.length) % slides.length)

  return (
    <section
      className="relative h-72 overflow-hidden rounded-2xl bg-brand-800 sm:h-[26rem]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        >
          {s.image_url ? (
            <img src={s.image_url} alt={s.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-linear-to-br from-brand-900 to-brand-600">
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-accent-600/70" />
              <div className="absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-white/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-r from-brand-900/85 via-brand-900/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12">
            <h1 className="max-w-xl text-2xl font-extrabold text-white sm:text-4xl">{s.title}</h1>
            {s.subtitle && <p className="mt-3 max-w-md text-sm text-white/90 sm:text-base">{s.subtitle}</p>}
            <Link
              to={s.link ?? '/produits'}
              className="mt-5 w-fit rounded-lg bg-accent-600 px-5 py-2.5 font-semibold text-white hover:bg-accent-700"
            >
              Découvrir nos produits
            </Link>
          </div>
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button onClick={() => go(current - 1)} aria-label="Précédent" className="absolute left-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-white/80 font-bold text-brand-800 hover:bg-white">
            ‹
          </button>
          <button onClick={() => go(current + 1)} aria-label="Suivant" className="absolute right-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-white/80 font-bold text-brand-800 hover:bg-white">
            ›
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIndex(i)}
                aria-label={`Aller à la slide ${i + 1}`}
                className={`h-2.5 rounded-full transition-all ${i === current ? 'w-6 bg-white' : 'w-2.5 bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}