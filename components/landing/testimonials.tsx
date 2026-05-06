"use client"

import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Carlos Silva",
    role: "Cliente há 2 anos",
    content: "Acompanho os jogos com ótima qualidade e quase nunca tenho problemas com travamentos.",
    rating: 5
  },
  {
    name: "Ana Santos",
    role: "Cliente há 1 ano",
    content: "Atendimento excelente e o acesso foi liberado em segundos após o pagamento. Super recomendo!",
    rating: 5
  },
  {
    name: "Roberto Lima",
    role: "Cliente há 6 meses",
    content: "A variedade de canais esportivos é excelente. O plano anual vale muito a pena pelo preço.",
    rating: 5
  }
]

const stats = [
  { value: "50.000+", label: "Clientes ativos" },
  { value: "99,9%", label: "Uptime garantido" },
  { value: "24/7", label: "Suporte disponível" },
  { value: "4.9/5", label: "Avaliação média" }
]

export function Testimonials() {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-foreground">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            O que nossos clientes dizem
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="bg-background rounded-2xl p-6 border border-border shadow-sm hover:shadow-lg hover:border-foreground/20 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm font-medium text-foreground">
                    {testimonial.name.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
