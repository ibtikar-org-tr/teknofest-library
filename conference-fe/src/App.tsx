import { SiteHeader } from '@/components/site-header'
import { SiteAnimations } from '@/components/site-animations'
import { Hero } from '@/components/hero'
import { RegisterPathsSection } from '@/components/register-paths-section'
import { AboutSection } from '@/components/about-section'
import { FactsSection } from '@/components/facts-section'
import { PrinciplesSection } from '@/components/principles-section'
import { AimsSection } from '@/components/aims-section'
import { ProgramSection } from '@/components/program-section'
import { AgendaSection } from '@/components/agenda-section'
import { ExhibitionSection } from '@/components/exhibition-section'
import { KitchenSection } from '@/components/kitchen-section'
import { PastEditionsSection } from '@/components/past-editions-section'
import { SiteFooter } from '@/components/site-footer'
import { TacArchivePage } from '@/components/tac-archive-page'
import { useLocale } from '@/i18n/locale-provider'
import { archiveYearForPage, isArchivePage } from '@/lib/page-url'

function HomePage() {
  return (
    <SiteAnimations>
      <Hero />
      <RegisterPathsSection />
      <FactsSection />
      <AboutSection />
      <PrinciplesSection />
      <AimsSection />
      <ProgramSection />
      <AgendaSection />
      <ExhibitionSection />
      <KitchenSection />
      <PastEditionsSection />
    </SiteAnimations>
  )
}

function App() {
  const { page } = useLocale()
  const year = archiveYearForPage(page)

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <SiteHeader />
      <main className="grow">
        {isArchivePage(page) && year ? <TacArchivePage year={year} /> : <HomePage />}
      </main>
      <SiteFooter />
    </div>
  )
}

export default App
