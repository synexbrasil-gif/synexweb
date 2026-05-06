"use client"

import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/fade-in"

export function Hero() {
  const scrollToPlanos = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const element = document.getElementById('planos')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            {/* Texto removido conforme solicitado */}
            
            <FadeIn direction="up" delay={100} duration={600} loadOnScroll={false}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight text-balance">
                Synex Brasil
              </h1>
            </FadeIn>
            
            <FadeIn direction="up" delay={200} duration={600} loadOnScroll={false}>
              <p className="mt-6 text-lg text-muted-foreground max-w-lg text-pretty">
                Assista futebol, lutas, automobilismo e muito mais em todos os seus dispositivos.
              </p>
            </FadeIn>
            
            <FadeIn direction="up" delay={300} duration={600} loadOnScroll={false}>
              <div className="mt-14 sm:mt-8 mb-12 lg:mb-0 flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="h-12 px-8 text-base shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                  <a href="https://wa.me/212693974294?text=Ol%C3%A1%2C%20quero%20fazer%20um%20teste%20da%20Synex." target="_blank" rel="noopener noreferrer">
                    Solicitar teste
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base hover:bg-muted transition-all">
                  <a href="#planos" onClick={scrollToPlanos}>Ver planos</a>
                </Button>
              </div>
            </FadeIn>
          </div>

          {/* Mockup */}
          <FadeIn direction="right" delay={400} duration={800} loadOnScroll={false}>
            <div className="relative flex items-center justify-center">
              <img
                src="https://i.ibb.co/gLBkgSzM/1.png"
                alt="Mockup de canais esportivos"
                className="max-w-full h-auto transition-transform duration-300 ease-in-out hover:scale-105"
                style={{ objectFit: "cover", aspectRatio: "16/9", boxShadow: "none", border: "none", borderRadius: 0, background: "none" }}
              />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
