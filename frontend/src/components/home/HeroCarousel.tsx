import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

interface Slide {
  id: string
  title: string
  subtitle: string | null
  image_url: string | null
  video_url: string | null
  link: string | null
}

// Slide affichée tant que le propriétaire n'a ajouté aucune publicité
const DEFAULT_SLIDES: Slide[] = [
  {
    id: 'default',
    title: 'Mangez bio vous épargne de l\'hôpital…',
    subtitle: 'Des produits agro-pastoraux frais, de chez nous, à commander en quelques clics.',
    image_url: null,
    video_url: null,
    link: '/produits',
  },
]

const IMAGE_DURATION = 6000 // une image reste 6 secondes ; une vidéo reste jusqu'à sa fin

export default function HeroCarousel() {
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(true) // les navigateurs n'autorisent le démarrage automatique que sans son

  useEffect(() => {
    supabase
      .from('adverts')
      .select('id, title, subtitle, image_url, video_url, link')
      .eq('kind', 'carousel')
      .eq('is_active', true)
      .order('position')
      .then(({ data }) => {
        if (data && data.length > 0) setSlides(data)
      })
  }, [])

  const count = slides.length
  const current = index % count
  const isVideo = Boolean(slides[current].video_url)
  const go = (i: number) => setIndex((i + count) % count)

  // Les images changent toutes seules ; les vidéos passent à la suivante quand elles se terminent.
  useEffect(() => {
    if (paused || count < 2 || isVideo) return
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), IMAGE_DURATION)
    return () => clearTimeout(timer)
  }, [paused, count, isVideo, index])

  return (
    <section
      aria-label="À la une"
      className="relative h-[calc(100svh-4.1rem)] max-h-[900px] min-h-[440px] w-full overflow-hidden bg-brand-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <h1 className="sr-only">AGRODIFA : produits agro-pastoraux bio</h1>

      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        >
          {s.image_url ? (
            <img src={s.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-brand-900 to-brand-600">
              <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-accent-600/70" />
              <div className="absolute -bottom-24 right-40 h-64 w-64 rounded-full bg-white/10" />
            </div>
          )}

          {/* La vidéo n'est chargée que lorsque sa slide est affichée */}
          {i === current && s.video_url && (
            <video
              key={s.video_url}
              src={s.video_url}
              poster={s.image_url ?? undefined}
              autoPlay
              muted={muted}
              playsInline
              preload="auto"
              loop={count === 1}
              onEnded={() => go(current + 1)}
              onError={() => count > 1 && go(current + 1)}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          <div className="absolute inset-0 bg-linear-to-r from-brand-900/80 via-brand-900/35 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />

          <div className="absolute inset-0 flex items-center">
            <div className="mx-auto w-full max-w-6xl px-4 pb-10">
              <h2 className="max-w-2xl text-3xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">{s.title}</h2>
              {s.subtitle && <p className="mt-4 max-w-xl text-base text-white/90 sm:text-xl">{s.subtitle}</p>}
              <Link
                to={s.link ?? '/produits'}
                className="mt-7 inline-block rounded-lg bg-accent-600 px-6 py-3 text-base font-semibold text-white hover:bg-accent-700"
              >
                Découvrir
              </Link>
            </div>
          </div>
        </div>
      ))}

      {count > 1 && (
        <>
          <button onClick={() => go(current - 1)} aria-label="Précédent" className="absolute left-3 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full bg-white/80 text-xl font-bold text-brand-800 hover:bg-white sm:left-6">
            ‹
          </button>
          <button onClick={() => go(current + 1)} aria-label="Suivant" className="absolute right-3 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full bg-white/80 text-xl font-bold text-brand-800 hover:bg-white sm:right-6">
            ›
          </button>
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIndex(i)}
                aria-label={`Aller à la slide ${i + 1}`}
                className={`h-2.5 rounded-full transition-all ${i === current ? 'w-8 bg-white' : 'w-2.5 bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}

      {isVideo && (
        <button
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? 'Activer le son' : 'Couper le son'}
          className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H2v6h4l5 4V5Z" />
            {muted ? <path d="m22 9-6 6M16 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />}
          </svg>
        </button>
      )}
    </section>
  )
}