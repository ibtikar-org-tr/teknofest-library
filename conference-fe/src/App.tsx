import { SiteHeader } from '@/components/site-header'
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
import { SiteFooter } from '@/components/site-footer'

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <SiteHeader />
      <main className="grow">
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
      </main>
      <SiteFooter />
    </div>
  )
}

export default App
