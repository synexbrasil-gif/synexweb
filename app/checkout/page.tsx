"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { Smartphone, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const plans = [
  {
    id: "mensal",
    name: "Mensal",
    price: "29,90",
    description: "Ideal para experimentar",
  },
  {
    id: "trimestral",
    name: "Trimestral",
    price: "49,90",
    description: "Melhor custo-benefício",
  },
  {
    id: "anual",
    name: "Anual",
    price: "99,90",
    description: "Maior economia",
  },
]

export default function CheckoutPage() {
  const [selectedPlan, setSelectedPlan] = useState(plans[0].id)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const plan = params.get("plano")?.toLowerCase()
    const matchedPlan = plans.find((item) => item.id === plan || item.name.toLowerCase() === plan)

    if (matchedPlan) {
      setSelectedPlan(matchedPlan.id)
    }
  }, [])

  const plan = useMemo(() => {
    return plans.find((item) => item.id === selectedPlan) ?? plans[0]
  }, [selectedPlan])

  const canSubmit = fullName.trim().length > 2 && phone.replace(/\D/g, "").length >= 10

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)

    if (!canSubmit) return
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_42%,oklch(0.91_0_0)_100%)] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_42%,oklch(0.91_0_0)_100%)]" />
      <div className="gradient-glow gradient-glow-1" style={{ top: "-260px", left: "-220px" }} />
      <div className="gradient-glow gradient-glow-2" style={{ top: "120px", right: "-260px" }} />
      <div className="gradient-glow gradient-glow-3" style={{ bottom: "-280px", left: "20%" }} />

      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl gap-5 lg:grid-cols-[1fr_24rem]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.97_0_0)_50%,oklch(0.93_0_0)_100%)] p-5 shadow-xl shadow-foreground/5 sm:p-7"
            style={{ animation: "synex-fade-in-up 420ms ease-out both" }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Checkout Pix</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Finalizar contratação</h1>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Preencha seus dados para preparar o pagamento via Pix.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <p className="text-sm font-semibold text-foreground">Escolha o plano</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {plans.map((item) => {
                    const isActive = item.id === selectedPlan

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedPlan(item.id)}
                        className={cn(
                          "rounded-xl border p-4 text-left transition-all duration-200",
                          isActive
                            ? "border-foreground/25 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.94_0_0)_100%)] shadow-md shadow-foreground/5"
                            : "border-border/70 bg-background/55 hover:border-foreground/20 hover:bg-background/80",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-foreground">{item.name}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                        <p className="mt-4 text-2xl font-bold text-foreground">
                          <span className="text-sm font-medium text-muted-foreground">R$ </span>
                          {item.price}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <CheckoutField
                  icon={<UserRound className="h-4 w-4" />}
                  label="Nome completo"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Digite seu nome completo"
                  error={submitted && fullName.trim().length <= 2 ? "Informe seu nome completo." : ""}
                />
                <CheckoutField
                  icon={<Smartphone className="h-4 w-4" />}
                  label="Numero de telefone"
                  value={phone}
                  onChange={(value) => setPhone(formatPhone(value))}
                  placeholder="(00) 00000-0000"
                  inputMode="tel"
                  maxLength={15}
                  error={submitted && phone.replace(/\D/g, "").length < 10 ? "Informe um telefone valido." : ""}
                />
              </div>

              <Button type="submit" className="h-12 w-full rounded-xl bg-foreground text-base text-background hover:bg-foreground/90">
                Continuar para Pix
              </Button>

              {submitted && canSubmit && (
                <div className="rounded-xl border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
                  Estrutura pronta. Na proxima etapa a API vai gerar o Pix para{" "}
                  <span className="font-semibold text-foreground">{fullName.trim()}</span>.
                </div>
              )}
            </div>
          </form>

          <aside
            className="rounded-2xl border border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.96_0_0)_54%,oklch(0.92_0_0)_100%)] p-5 shadow-xl shadow-foreground/5 sm:p-6"
            style={{ animation: "synex-fade-in-left 460ms ease-out both" }}
          >
            <div className="border-b border-border/70 pb-5">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Resumo</p>
              <h2 className="mt-2 text-2xl font-bold text-foreground">{plan.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-5 text-4xl font-bold text-foreground">
                <span className="text-base font-medium text-muted-foreground">R$ </span>
                {plan.price}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {["Pagamento via Pix", "Acesso liberado após confirmação", "Dados protegidos na contratação"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl bg-background/55 p-3">
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

function CheckoutField({
  icon,
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  maxLength,
  error,
}: {
  icon: ReactNode
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  inputMode?: "text" | "tel" | "numeric"
  maxLength?: number
  error?: string
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </span>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn("mt-2 h-12 rounded-xl bg-background/70", error && "border-destructive focus-visible:ring-destructive/20")}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        required
      />
      {error && <span className="mt-1 block text-xs font-medium text-destructive">{error}</span>}
    </label>
  )
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)

  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}
