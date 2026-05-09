"use client"

import { type ComponentType, type FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, FileText, KeyRound, Menu, MessageCircle, TvMinimal, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useNotification } from "@/components/notification-provider"
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

type ContractSection = "overview" | "access" | "channels" | "renewal"
type SectionItem = {
  id: ContractSection
  label: string
  icon: ComponentType<{ className?: string }>
}

export default function ContratoPage() {
  const router = useRouter()
  const { notify } = useNotification()
  const [contract, setContract] = useState<SubscriberContract | null>(null)
  const [activeSection, setActiveSection] = useState<ContractSection>("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [panelOpen, setPanelOpen] = useState(false)
  const [credentialUsername, setCredentialUsername] = useState("")
  const [credentialPassword, setCredentialPassword] = useState("")
  const [showCredentialPassword, setShowCredentialPassword] = useState(false)
  const [isSavingCredentials, setIsSavingCredentials] = useState(false)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const requestedSection = searchParams.get("section")

    if (
      requestedSection === "access" ||
      requestedSection === "channels" ||
      requestedSection === "renewal" ||
      requestedSection === "overview"
    ) {
      setActiveSection(requestedSection)
    }
  }, [])

  useEffect(() => {
    const username = sessionStorage.getItem("iptv_username")
    const password = sessionStorage.getItem("iptv_password")
    const paymentId = sessionStorage.getItem("synex_payment_id")

    if ((!username || !password) && !paymentId) {
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
          body: JSON.stringify(paymentId ? { paymentId } : { username, password }),
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

  useEffect(() => {
    setCredentialUsername(contract?.loginUsername ?? "")
    setCredentialPassword(contract?.loginPassword ?? "")
  }, [contract?.loginPassword, contract?.loginUsername])

  const reference = contract?.contractUsername || contract?.paymentId || contract?.contractId || ""
  const isPendingActivation = contract?.contractUsername?.trim() === "0"
  const shouldDefineCredentials = contract?.contractUsername?.trim() === "0" && !contract?.loginUsername
  const isExpired = contract ? isContractExpired(contract.activationDate, contract.plan) : false
  const credentialsMessage = contract?.fullName
    ? `*${contract.fullName}*\nDesejo fazer a renovação do meu contrato.`
    : "Desejo fazer a renovação do meu contrato."
  const credentialsUrl = `https://wa.me/212693974294?text=${encodeURIComponent(credentialsMessage)}`
  const changePlanMessage = contract?.fullName
    ? `*${contract.fullName}*\nDesejo alterar o plano do meu contrato.`
    : "Desejo alterar o plano do meu contrato."
  const changePlanUrl = `https://wa.me/212693974294?text=${encodeURIComponent(changePlanMessage)}`
  const handleBack = () => {
    sessionStorage.removeItem("iptv_username")
    sessionStorage.removeItem("iptv_password")
    sessionStorage.removeItem("synex_payment_id")
    localStorage.removeItem("synex_remember_session")
    localStorage.removeItem("synex_login_username")
    localStorage.removeItem("synex_login_password")
    router.replace("/")
  }
  const handleWatchChannels = () => {
    if (isPendingActivation) {
      const customerName = contract?.fullName || "Cliente"
      const message = `*${customerName}*\nÉ meu primeiro acesso, quero ativar meu contrato.`

      window.open(`https://wa.me/212693974294?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer")
      return
    }

    router.push("/dashboard")
  }
  const handleCredentialsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const cleanUsername = credentialUsername.trim()
    const cleanPassword = credentialPassword.trim()

    if (!cleanUsername || !cleanPassword) {
      notify({ title: "Dados incompletos", description: "Informe usuario e senha.", tone: "error" })
      return
    }

    const currentUsername = sessionStorage.getItem("iptv_username")
    const currentPassword = sessionStorage.getItem("iptv_password")
    const paymentId = sessionStorage.getItem("synex_payment_id")

    if ((!currentUsername || !currentPassword) && !paymentId) {
      router.replace("/login")
      return
    }

    setIsSavingCredentials(true)

    try {
      const response = await fetch("/api/assinante/credenciais", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentUsername,
          currentPassword,
          paymentId,
          username: cleanUsername,
          password: cleanPassword,
        }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        notify({
          title: "Credenciais nao salvas",
          description: data?.error ?? "Nao foi possivel salvar suas credenciais.",
          tone: "error",
        })
        return
      }

      if (data?.contract?.iptvUsername && data?.contract?.iptvPassword) {
        sessionStorage.setItem("iptv_username", data.contract.iptvUsername)
        sessionStorage.setItem("iptv_password", data.contract.iptvPassword)
      }

      setContract((currentContract) =>
        currentContract
          ? {
              ...currentContract,
              loginUsername: cleanUsername,
              loginPassword: cleanPassword,
            }
          : currentContract,
      )
      notify({ title: "Credenciais salvas", description: "Seu login foi atualizado com sucesso.", tone: "success" })
    } catch {
      notify({
        title: "Credenciais nao salvas",
        description: "Nao foi possivel salvar suas credenciais.",
        tone: "error",
      })
    } finally {
      setIsSavingCredentials(false)
    }
  }
  const sections: SectionItem[] = [
    { id: "overview", label: "Contrato", icon: FileText },
    { id: "access", label: "Acesso", icon: KeyRound },
    { id: "channels", label: "Canais", icon: TvMinimal },
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
        {panelOpen && (
          <div
            className="fixed inset-x-0 bottom-0 top-[73px] z-30 bg-foreground/20 lg:hidden"
            onClick={() => setPanelOpen(false)}
          />
        )}

        <aside
          className={cn(
            "fixed bottom-0 left-0 top-[73px] z-40 flex w-72 shrink-0 flex-col border-r border-sidebar-border/40 bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_58%,oklch(0.92_0_0)_100%)] transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
            panelOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-[73px] items-center gap-3 border-b border-border/60 px-6">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border/70 bg-background/70 text-foreground shadow-sm">
              <UserRound className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{contract?.fullName ?? "Cliente"}</p>
              <p className="text-xs text-muted-foreground">Meu contrato</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {sections.map((section) => {
              const Icon = section.icon

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(section.id)
                    setPanelOpen(false)
                  }}
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
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full rounded-lg bg-background/70"
              onClick={handleBack}
              aria-label={isExpired ? "Voltar para a pagina inicial" : "Voltar ao dashboard"}
            >
              Voltar
            </Button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="fixed left-0 right-0 top-0 z-30 flex min-h-[73px] items-center border-b border-border/60 bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_42%,oklch(0.92_0_0)_100%)] px-4 lg:static lg:bg-background/35 lg:px-6 lg:backdrop-blur-xl">
            <Button variant="ghost" size="icon" className="rounded-xl lg:hidden" onClick={() => setPanelOpen((open) => !open)}>
              <Menu className="h-5 w-5" />
            </Button>
          </header>

          <div key={activeSection} className="flex-1 p-3 pt-[85px] sm:p-6 sm:pt-[97px] lg:p-8" style={{ animation: "synex-fade-in-up 260ms ease-out both" }}>
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

                <div className="border-t border-border/70 p-5">
                  <form onSubmit={handleCredentialsSubmit} className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                    <label className="block">
                      <span className="text-xs font-medium text-muted-foreground">
                        {shouldDefineCredentials ? "Usuario" : "Novo usuario"}
                      </span>
                      <Input
                        value={credentialUsername}
                        onChange={(event) => setCredentialUsername(event.target.value)}
                        placeholder="Digite o usuario"
                        disabled={isSavingCredentials}
                        className="mt-2 h-11 rounded-lg bg-background/70"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-medium text-muted-foreground">
                        {shouldDefineCredentials ? "Senha" : "Nova senha"}
                      </span>
                      <div className="relative mt-2">
                        <Input
                          type={showCredentialPassword ? "text" : "password"}
                          value={credentialPassword}
                          onChange={(event) => setCredentialPassword(event.target.value)}
                          placeholder="Digite a senha"
                          disabled={isSavingCredentials}
                          className="h-11 rounded-lg bg-background/70 pr-11"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCredentialPassword((visible) => !visible)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={showCredentialPassword ? "Ocultar senha" : "Mostrar senha"}
                          disabled={isSavingCredentials}
                        >
                          {showCredentialPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </label>

                    <Button
                      type="submit"
                      className="h-11 rounded-lg bg-foreground px-6 text-background hover:bg-foreground/90"
                      disabled={isSavingCredentials}
                    >
                      {isSavingCredentials ? (
                        <span className="flex items-center gap-2">
                          <Spinner className="h-5 w-5" />
                          Salvando...
                        </span>
                      ) : shouldDefineCredentials ? (
                        "Definir credenciais"
                      ) : (
                        "Salvar credenciais"
                      )}
                    </Button>
                  </form>
                </div>
              </section>
            ) : activeSection === "channels" ? (
              <section className="rounded-lg border border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.97_0_0)_50%,oklch(0.94_0_0)_100%)] p-5 shadow-sm">
                <h2 className="text-base font-semibold text-foreground">Canais</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Acesse o player para assistir aos canais liberados no seu contrato.
                </p>

                <div className="mt-5 rounded-lg border border-border/70 bg-background/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Acesso ao player</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {isPendingActivation
                      ? "Ative seu contrato para acessar o conteúdo"
                      : "Clique para acessar o conteúdo disponivel"}
                  </p>
                </div>

                <div className="mt-5">
                  <Button
                    type="button"
                    className="h-11 rounded-lg bg-foreground px-6 text-background hover:bg-foreground/90"
                    onClick={handleWatchChannels}
                  >
                    {isPendingActivation ? "Ativar contrato" : "Assistir canais"}
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
                    {isPendingActivation ? "Contrato aguardando ativação" : isExpired ? "Contrato vencido" : "Contrato ativo"}
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="h-11 rounded-lg bg-foreground px-6 text-background hover:bg-foreground/90">
                    <a href={credentialsUrl} target="_blank" rel="noopener noreferrer">
                      Renovar contrato
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="h-11 rounded-lg bg-background/70 px-6 hover:bg-black hover:text-white">
                    <a href={changePlanUrl} target="_blank" rel="noopener noreferrer">
                      Alterar plano
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
  expirationDate.setHours(0, 0, 0, 0)

  return Date.now() >= expirationDate.getTime()
}
