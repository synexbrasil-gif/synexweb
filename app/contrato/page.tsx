"use client"

import { type ComponentType, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, KeyRound, MessageCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SubscriberContract = {
  activationDate: string | null
  contractId: string | null
  contractUsername: string | null
  fullName: string | null
  loginPassword: string | null
  loginUsername: string | null
  paymentId: string | null
  plan: string | null
}

type ContractSection = "overview" | "access" | "renewal"
type SectionItem = {
  id: ContractSection
  label: string
  icon: ComponentType<{ className?: string }>
}

export default function ContratoPage() {
  const router = useRouter()
  const [contract, setContract] = useState<SubscriberContract | null>(null)
  const [activeSection, setActiveSection] = useState<ContractSection>("overview")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const username = sessionStorage.getItem("iptv_username")
    const password = sessionStorage.getItem("iptv_password")

    if (!username || !password) {
      router.replace("/login")
      return
    }

    let cancelled = false

    const loadContract = async () => {
      try {
        const response = await fetch("/api/assinante", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        })

        const data = (await response.json()) as SubscriberContract

        if (cancelled) return

        if (!response.ok || !data.contractId) {
          router.replace("/checkout")
          return
        }

        setContract(data)
      } catch {
        if (!cancelled) {
          router.replace("/checkout")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadContract()

    return () => {
      cancelled = true
    }
  }, [router])

  const reference = contract?.contractUsername || contract?.paymentId || contract?.contractId || ""
  const isExpired = contract ? isContractExpired(contract.activationDate, contract.plan) : false
  const credentialsMessage = contract?.fullName
    ? `*${contract.fullName}*\nDesejo fazer a renovação do meu contrato.`
    : "Desejo fazer a renovação do meu contrato."
  const credentialsUrl = `https://wa.me/212693974294?text=${encodeURIComponent(credentialsMessage)}`
  const sections: SectionItem[] = [
    { id: "overview", label: "Contrato", icon: FileText },
    { id: "access", label: "Acesso", icon: KeyRound },
    { id: "renewal", label: "Renovação", icon: MessageCircle },
  ]
  const contractDetails = [
    { label: "Cliente", value: contract?.fullName ?? "Não informado" },
    { label: "Plano", value: contract?.plan ?? "Não informado" },
    { label: "Ativação", value: contract?.activationDate ?? "Não informado" },
    { label: "Referência", value: reference || "Não informado", mono: true },
  ]
  const accessDetails = [
    { label: "Usuário de acesso", value: contract?.loginUsername ?? "Não informado" },
    { label: "Senha de acesso", value: contract?.loginPassword ?? "Não informado" },
  ]

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_42%,oklch(0.92_0_0)_100%)] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_42%,oklch(0.92_0_0)_100%)]" />
      <div className="gradient-glow gradient-glow-1" style={{ top: "-220px", left: "-180px" }} />
      <div className="gradient-glow gradient-glow-2" style={{ top: "160px", right: "-220px" }} />
      <div className="gradient-glow gradient-glow-3" style={{ bottom: "-260px", left: "25%" }} />

      <div className="relative z-10 flex min-h-screen" style={{ animation: "synex-fade-in 420ms ease-out both" }}>
        <aside className="hidden w-72 shrink-0 border-r border-sidebar-border/40 bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_58%,oklch(0.92_0_0)_100%)] lg:flex lg:flex-col">
          <div className="flex h-[73px] flex-col justify-center border-b border-border/60 px-6">
            <p className="truncate text-sm font-semibold text-foreground">{contract?.fullName ?? "Cliente"}</p>
            <p className="text-xs text-muted-foreground">Meu contrato</p>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {sections.map((section) => {
              const Icon = section.icon

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-all duration-200",
                    activeSection === section.id
                      ? "bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.94_0_0)_58%,oklch(0.90_0_0)_100%)] text-sidebar-accent-foreground shadow-md shadow-foreground/5"
                      : "text-sidebar-foreground/70 hover:bg-white/35 hover:text-sidebar-foreground hover:shadow-sm",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="min-w-0">
                      <span className="block truncate">{section.label}</span>
                    </span>
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      activeSection === section.id ? "bg-foreground/10 text-foreground" : "bg-foreground/5 text-muted-foreground",
                    )}
                  >
                    1
                  </span>
                </button>
              )
            })}
          </nav>

          <div className="border-t border-border/60 p-4">
            <Button asChild variant="outline" className="h-10 w-full rounded-lg bg-background/70">
              <a href="/dashboard">Voltar</a>
            </Button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="min-h-[73px] border-b border-border/60 bg-background/35 backdrop-blur-xl" />

          <div className="border-b border-border/60 bg-background/25 p-3 lg:hidden">
            <div className="grid grid-cols-3 gap-2">
              {sections.map((section) => {
                const Icon = section.icon

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      activeSection === section.id ? "bg-foreground text-background" : "bg-background/70 text-muted-foreground",
                    )}
                    >
                      <Icon className="h-4 w-4" />
                      {section.label}
                      <span className="rounded-full bg-current/10 px-1.5 py-0.5 text-[10px] font-semibold">1</span>
                    </button>
                )
              })}
            </div>
          </div>

          <div key={activeSection} className="flex-1 p-4 sm:p-6 lg:p-8" style={{ animation: "synex-fade-in-up 260ms ease-out both" }}>
            {isLoading ? (
              <section className="grid min-h-[28rem] place-items-center rounded-lg border border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.97_0_0)_50%,oklch(0.94_0_0)_100%)] shadow-sm">
                <div className="text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-foreground" />
                  <p className="mt-4 text-sm font-medium text-muted-foreground">Carregando contrato...</p>
                </div>
              </section>
            ) : activeSection === "overview" ? (
              <section className="rounded-lg border border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.97_0_0)_50%,oklch(0.94_0_0)_100%)] shadow-sm">
                <div className="border-b border-border/70 p-5">
                  <h2 className="text-base font-semibold text-foreground">Informações do contrato</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Confira os dados vinculados ao seu plano.</p>
                </div>

                <div className="grid gap-3 p-5 md:grid-cols-2">
                  {contractDetails.map((item) => (
                    <InfoBlock key={item.label} label={item.label} value={item.value} mono={item.mono} />
                  ))}
                </div>
              </section>
            ) : activeSection === "access" ? (
              <section className="rounded-lg border border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.97_0_0)_50%,oklch(0.94_0_0)_100%)] shadow-sm">
                <div className="border-b border-border/70 p-5">
                  <h2 className="text-base font-semibold text-foreground">Dados de acesso</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Informações usadas para entrar no serviço.</p>
                </div>

                <div className="grid gap-3 p-5 md:grid-cols-2">
                  {accessDetails.map((item) => (
                    <InfoBlock key={item.label} label={item.label} value={item.value} mono />
                  ))}
                </div>

                <div className="flex justify-end border-t border-border/70 p-5">
                  <Button asChild className="h-11 rounded-lg bg-foreground px-6 text-background hover:bg-foreground/90">
                    <a href="/contrato/credenciais">Alterar credenciais</a>
                  </Button>
                </div>
              </section>
            ) : (
              <section className="rounded-lg border border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.97_0_0)_50%,oklch(0.94_0_0)_100%)] p-5 shadow-sm">
                <h2 className="text-base font-semibold text-foreground">Renovação</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Solicite a renovação pelo atendimento. A mensagem já envia seu nome para facilitar a identificação do contrato.
                </p>

                <div className="mt-5 rounded-lg border border-border/70 bg-background/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Situação</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {isExpired ? "Renovação disponível" : "Contrato dentro do período do plano"}
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="h-11 rounded-lg bg-foreground px-6 text-background hover:bg-foreground/90">
                    <a href={credentialsUrl} target="_blank" rel="noopener noreferrer">
                      Renovar contrato
                    </a>
                  </Button>
                </div>
              </section>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

function InfoBlock({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/65 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={cn("mt-3 truncate text-lg font-semibold text-foreground", mono && "font-mono text-sm")} title={value}>
        {value}
      </p>
    </div>
  )
}

function parseBrazilianDate(value: string | null) {
  const match = value?.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null

  const [, day, month, year] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))

  if (Number.isNaN(date.getTime())) return null
  return date
}

function getPlanDurationInMonths(plan: string | null) {
  const normalizedPlan = plan?.trim().toLowerCase() ?? ""

  if (normalizedPlan.includes("mensal")) return 1
  if (normalizedPlan.includes("trimestral")) return 3
  if (normalizedPlan.includes("anual")) return 12

  return null
}

function isContractExpired(activationDate: string | null, plan: string | null) {
  const startDate = parseBrazilianDate(activationDate)
  const durationInMonths = getPlanDurationInMonths(plan)

  if (!startDate || !durationInMonths) return false

  const expirationDate = new Date(startDate)
  expirationDate.setMonth(expirationDate.getMonth() + durationInMonths)
  expirationDate.setHours(23, 59, 59, 999)

  return Date.now() > expirationDate.getTime()
}
