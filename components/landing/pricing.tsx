"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { FadeIn } from "@/components/fade-in"
import type { Plan } from "@/lib/contracts-db"

const defaultPlans = [
  {
    id: "mensal",
    name: "Mensal",
    price: "29,90",
    description: "Ideal para experimentar",
    features: [
      "Canais esportivos ao vivo",
      "Jogos e eventos esportivos",
      "Qualidade Full HD",
      "Player pelo navegador",
      "Suporte via WhatsApp"
    ],
    href: "/checkout?plano=mensal"
  },
  {
    id: "trimestral",
    name: "Trimestral",
    price: "49,90",
    description: "Melhor custo-beneficio",
    features: [
      "Canais esportivos ao vivo",
      "Jogos e eventos esportivos",
      "Qualidade Full HD",
      "Player pelo navegador",
      "Suporte via WhatsApp"
    ],
    href: "/checkout?plano=trimestral"
  },
  {
    id: "anual",
    name: "Anual",
    price: "99,90",
    description: "Maior economia",
    features: [
      "Canais esportivos ao vivo",
      "Jogos e eventos esportivos",
      "Qualidade Full HD",
      "Player pelo navegador",
      "Suporte via WhatsApp"
    ],
    href: "/checkout?plano=anual"
  }
]

type PricingPlan = Pick<Plan, "id" | "name" | "price" | "description">

function formatPrice(price: number) {
  return Number(price).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function mergePlans(databasePlans: PricingPlan[]) {
  return defaultPlans.map((currentPlan) => {
    const databasePlan = databasePlans.find((plan) => plan.id === currentPlan.id)
    if (!databasePlan) return currentPlan

    return {
      ...currentPlan,
      name: databasePlan.name,
      price: formatPrice(databasePlan.price),
      description: databasePlan.description,
    }
  })
}

export function Pricing({ initialPlans }: { initialPlans?: PricingPlan[] }) {
  const [plans, setPlans] = useState(() => mergePlans(initialPlans ?? []))

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await fetch("/api/planos", { cache: "no-store" })
        if (!response.ok) return

        const data = await response.json()
        if (!Array.isArray(data.plans)) return

        setPlans(mergePlans(data.plans))
      } catch {
        return
      }
    }

    loadPlans()
  }, [])

  return (
    <section id="planos" className="py-24 md:py-36 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn duration={400}>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Escolha seu plano
            </h2>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Pague via Pix e tenha acesso imediato aos canais esportivos.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <FadeIn key={plan.name} delay={50 + index * 50} duration={400}>
              <div className="group rounded-2xl p-8 h-full bg-background border border-border hover:border-foreground/20 transition-colors duration-200">
              {/* Header */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="text-center mb-6 pb-6 border-b border-border">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-base text-muted-foreground font-medium">R$</span>
                  <span className="text-5xl font-bold text-foreground tracking-tight">
                    {plan.price}
                  </span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-foreground/5">
                      <Check className="w-3 h-3 text-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                asChild
                size="lg"
                className="w-full h-12 px-8 text-base shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                variant="outline"
              >
                <a href={plan.href}>
                  Contratar agora
                </a>
              </Button>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
