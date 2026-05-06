"use client"

const steps = [
  {
    number: "1",
    title: "Escolha um plano",
    description: "Selecione o plano que combina com sua rotina de jogos, campeonatos e eventos esportivos."
  },
  {
    number: "2",
    title: "Pague via Pix",
    description: "Realize o pagamento de forma rápida e segura usando Pix. Confirmação instantânea."
  },
  {
    number: "3",
    title: "Comece a assistir",
    description: "Seu acesso é liberado automaticamente. Aproveite os canais esportivos no seu dispositivo preferido."
  }
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 md:py-32 scroll-mt-20 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground text-balance">
            Simples e rápido
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto text-pretty">
            Comece a acompanhar seus esportes favoritos em minutos. Sem burocracia, sem complicação.
          </p>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div key={step.number} className="group">
                <div className="bg-background border border-border rounded-2xl p-8 h-full hover:border-foreground/20 hover:shadow-xl transition-all duration-300">
                  {/* Number badge */}
                  <div className="mb-6">
                    <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-xl font-bold">
                      {step.number}
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-xl text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          <div className="flex flex-col gap-6">
            {steps.map((step) => (
              <div key={step.number} className="bg-background border border-border rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-lg font-bold shrink-0">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">
                    {step.title}
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
