import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { Benefits } from "@/components/landing/benefits"
import { Pricing } from "@/components/landing/pricing"
import { HowItWorks } from "@/components/landing/how-it-works"
import { FaqSection } from "@/components/landing/faq-section"
import { FadeIn } from "@/components/fade-in"
import { ClearLoginReturnFlag } from "@/components/clear-login-return-flag"

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-x-hidden">
      {/* Background gradient uniforme */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-background to-muted/30 pointer-events-none" />
      
      {/* Gradient glow effects globais */}
      <div className="gradient-glow gradient-glow-1" style={{ top: '-200px', left: '-150px' }} />
      <div className="gradient-glow gradient-glow-2" style={{ top: '300px', right: '-200px' }} />
      <div className="gradient-glow gradient-glow-1" style={{ top: '800px', left: '-100px' }} />
      <div className="gradient-glow gradient-glow-3" style={{ top: '1200px', right: '-150px' }} />
      <div className="gradient-glow gradient-glow-2" style={{ top: '1600px', left: '-200px' }} />
      <div className="gradient-glow gradient-glow-1" style={{ top: '2000px', right: '-100px' }} />
      
      <div className="relative z-10">
        <ClearLoginReturnFlag />
        <Navbar />
        <Hero />
        <FadeIn>
          <Benefits />
        </FadeIn>
        <FadeIn delay={100}>
          <Pricing />
        </FadeIn>
        <FadeIn delay={100}>
          <HowItWorks />
        </FadeIn>
        <FadeIn delay={100}>
          <FaqSection />
        </FadeIn>
      </div>
    </main>
  )
}
