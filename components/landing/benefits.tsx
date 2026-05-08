const benefits = [
  {
    number: "01",
    title: "Esportes ao vivo",
    description: "Acompanhe canais esportivos com futebol, lutas, automobilismo, basquete, tênis e muito mais."
  },
  {
    number: "02",
    title: "Imagem de qualidade",
    description: "Assista aos jogos e eventos com transmissão estável e alta qualidade de imagem."
  },
  {
    number: "03",
    title: "Acesso imediato",
    description: "Assim que o pagamento for confirmado, seu acesso é liberado automaticamente."
  },
  {
    number: "04",
    title: "Player no navegador",
    description: "Acesse pelo navegador do computador, celular, tablet ou Smart TV. O player funciona pelo site, sem app dedicado."
  }
]

export function Benefits() {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Por que escolher a Synex?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Uma experiência feita para quem quer acompanhar esporte ao vivo com praticidade, estabilidade e suporte rápido.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className="group flex gap-6 items-start"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <span className="text-5xl md:text-6xl font-bold text-muted-foreground/20 group-hover:text-foreground/20 transition-colors leading-none">
                {benefit.number}
              </span>
              <div className="pt-2">
                <h3 className="font-semibold text-xl text-foreground mb-2 group-hover:translate-x-1 transition-transform">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
