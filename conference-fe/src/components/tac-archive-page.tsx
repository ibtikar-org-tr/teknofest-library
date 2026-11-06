import { useState } from 'react'
import {
  Archive,
  ArrowLeft,
  Calendar,
  Clock,
  ImageIcon,
  MapPin,
  Sparkles,
  Users,
} from 'lucide-react'
import { useLocale } from '@/i18n/locale-provider'
import { TAC_2023_HERO_IMAGE, TAC_2023_IMAGES, tac2023ImageUrl } from '@/lib/tac-2023-images'
import { TAC_2024_HERO_IMAGE, TAC_2024_IMAGES, tac2024ImageUrl } from '@/lib/tac-2024-images'
import { buildPageHref, navigateToPage, type ArchiveYear } from '@/lib/page-url'
import { cn } from '@/lib/utils'

type TacArchivePageProps = {
  year: ArchiveYear
}

export function TacArchivePage({ year }: TacArchivePageProps) {
  const { lang, archive: t } = useLocale()
  const [lightbox, setLightbox] = useState<string | null>(null)

  if (!t) return null

  const heroImage = year === 2023 ? TAC_2023_HERO_IMAGE : TAC_2024_HERO_IMAGE
  const images = year === 2023 ? TAC_2023_IMAGES : TAC_2024_IMAGES
  const imageUrl = year === 2023 ? tac2023ImageUrl : tac2024ImageUrl
  const h = t.hero

  const facts = [
    { icon: MapPin, label: h.city, value: h.cityValue },
    { icon: Calendar, label: h.dates, value: h.datesValue },
    { icon: Users, label: h.attendees, value: h.attendeesValue },
    { icon: Clock, label: h.days, value: h.daysValue },
  ]

  const homeHref = buildPageHref('home')

  return (
    <>
      <section id="top" className="relative overflow-hidden pb-12 pt-28 md:pb-16 md:pt-32">
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-primary/5 via-background to-background" />

        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:text-sm">
                  <Archive className="size-3.5" />
                  {h.archived}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground sm:text-sm">
                  <span className="size-1.5 rounded-full bg-primary" />
                  {h.badge}
                </div>
              </div>

              <h1 className="mt-5 font-display text-[2rem] font-extrabold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl">
                <span className="block">{h.titleTop}</span>
                <span className="mt-1 block bg-linear-to-r from-primary to-red-600 bg-clip-text text-transparent">
                  {h.titleBottom}
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {h.subtitle}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href="#program"
                  className="inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {h.viewProgram}
                  <ArrowLeft className="size-4 rtl:rotate-0 ltr:rotate-180" />
                </a>
                <a
                  href="#speakers"
                  className="inline-flex min-h-11 items-center justify-center gap-2 border border-border bg-card/50 px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-card"
                >
                  {t.nav.speakers}
                </a>
                <a
                  href="#gallery"
                  className="inline-flex min-h-11 items-center justify-center gap-2 border border-border bg-card/50 px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-card"
                >
                  <ImageIcon className="size-4" />
                  {h.viewGallery}
                </a>
              </div>
            </div>

            <div className="relative overflow-hidden border border-border">
              <img
                src={heroImage}
                alt={
                  lang === 'ar'
                    ? `مؤتمر تكنوفست بالعربي ${year} في إسطنبول`
                    : lang === 'tr'
                      ? `İstanbul Arapça TEKNOFEST Konferansı ${year}`
                      : `TEKNOFEST in Arabic Conference ${year} in Istanbul`
                }
                className="aspect-4/3 w-full bg-secondary object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent" />
            </div>
          </div>

          <div className="mt-10 lg:mt-14">
            <div className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border min-[380px]:grid-cols-2 lg:grid-cols-4">
              {facts.map((f) => (
                <div key={f.label} className="flex items-center gap-3 bg-card p-3.5 sm:p-4 lg:p-5">
                  <div className="grid size-9 shrink-0 place-items-center bg-primary/10 text-primary sm:size-10">
                    <f.icon className="size-4 sm:size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">{f.label}</div>
                    <div className="text-sm font-semibold leading-snug text-balance">{f.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="bg-background py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-primary">{t.about.label}</p>
              <h2 className="mt-4 font-display text-3xl font-bold leading-tight md:text-4xl">
                {t.about.title}
              </h2>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t.about.body}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 self-center sm:gap-4">
              {t.about.stats.map((s) => (
                <div
                  key={s.label}
                  className="border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:p-6"
                >
                  <div className="font-display text-3xl font-extrabold text-primary sm:text-4xl">
                    {s.value}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="program" className="bg-card/30 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-widest text-primary">{t.program.label}</p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight md:text-4xl">
              {t.program.title}
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">{t.program.subtitle}</p>
          </div>

          <ol className="mt-12 space-y-3">
            {t.program.items.map((item) => (
              <li
                key={`${item.time}-${item.title}`}
                className="grid gap-2 border border-border bg-card p-4 sm:grid-cols-[8.5rem_1fr] sm:gap-6 sm:p-5"
              >
                <span className="font-mono text-sm font-semibold text-primary">{item.time}</span>
                <div>
                  <h3 className="font-display text-base font-bold text-balance sm:text-lg">{item.title}</h3>
                  {item.body ? (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="highlights" className="bg-background py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-widest text-primary">
              {t.highlights.label}
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight md:text-4xl">
              {t.highlights.title}
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">{t.highlights.subtitle}</p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.highlights.items.map((item, i) => (
              <div
                key={item.title}
                className="group flex flex-col border border-border bg-card p-6 transition-all hover:border-primary/50"
              >
                <div className="grid size-11 place-items-center bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Sparkles className="size-5" />
                </div>
                <span className="mt-4 font-mono text-xs text-primary">
                  #{String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-2 font-display text-lg font-bold leading-snug text-balance">
                  {item.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {item.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="speakers" className="bg-card/30 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-widest text-primary">{t.speakers.label}</p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight md:text-4xl">
              {t.speakers.title}
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">{t.speakers.subtitle}</p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.speakers.items.map((speaker) => (
              <article
                key={`${speaker.name}-${speaker.role}`}
                className="border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <div className="mb-4 grid size-12 place-items-center bg-primary/10 text-primary">
                  <Users className="size-5" />
                </div>
                <h3 className="font-display text-base font-bold leading-snug text-balance">{speaker.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{speaker.role}</p>
                {speaker.org ? (
                  <p className="mt-1 font-mono text-xs text-primary">{speaker.org}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {speaker.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="gallery" className="bg-background py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-widest text-primary">{t.gallery.label}</p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight md:text-4xl">
              {t.gallery.title}
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">{t.gallery.subtitle}</p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
            {images.map((filename, i) => {
              const src = imageUrl(filename)
              return (
                <button
                  key={filename}
                  type="button"
                  onClick={() => setLightbox(src)}
                  className={cn('group relative', i === 0 && 'col-span-2 row-span-2 md:col-span-2 md:row-span-2')}
                >
                  <div className="relative overflow-hidden border border-border bg-card transition-colors group-hover:border-primary/50">
                    <img
                      src={src}
                      alt={
                        lang === 'ar'
                          ? `صورة من مؤتمر تكنوفست بالعربي ${year} — ${i + 1}`
                          : lang === 'tr'
                            ? `Arapça TEKNOFEST ${year} fotoğrafı — ${i + 1}`
                            : `Photo from TAC ${year} — ${i + 1}`
                      }
                      className="aspect-square w-full bg-secondary object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-background/0 transition-colors group-hover:bg-background/10" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="pb-24 pt-4">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="border border-primary/30 bg-primary/5 p-8 text-center sm:p-12">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">{t.cta.title}</h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">{t.cta.subtitle}</p>
            <a
              href={homeHref}
              onClick={(e) => navigateToPage(e, 'home')}
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t.cta.button}
              <ArrowLeft className="size-4 rtl:rotate-0 ltr:rotate-180" />
            </a>
          </div>
        </div>
      </section>

      {lightbox ? (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute end-4 top-4 border border-border bg-card px-3 py-1.5 text-sm"
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>
          <img
            src={lightbox}
            alt=""
            className="max-h-[90vh] max-w-full object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  )
}
