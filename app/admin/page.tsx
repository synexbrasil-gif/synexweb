"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Eye,
  EyeOff,
  FileText,
  Search,
  Trash2,
  UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Contract = {
  id: string
  fullName: string
  username: string
  password: string
  activationDate: string
  plan: string
  createdAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [activationDate, setActivationDate] = useState("")
  const [plan, setPlan] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingContracts, setIsLoadingContracts] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadContracts = async () => {
      setIsLoadingContracts(true)

      try {
        const response = await fetch("/api/contratos", { cache: "no-store" })
        if (response.status === 401) {
          router.replace("/contrato/login?next=/admin")
          return
        }

        if (!response.ok) {
          const data = await response.json().catch(() => null)
          setError(data?.error ?? "Nao foi possivel carregar os contratos.")
          return
        }

        const data = await response.json()
        if (Array.isArray(data.contracts)) {
          setContracts(data.contracts)
        }
      } catch {
        setError("Nao foi possivel carregar os contratos.")
      } finally {
        setIsLoadingContracts(false)
      }
    }

    loadContracts()
  }, [router])

  const filteredContracts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return contracts

    return contracts.filter((contract) => {
      return `${contract.fullName} ${contract.username} ${contract.plan ?? ""}`.toLowerCase().includes(query)
    })
  }, [contracts, searchQuery])

  const totalPlans = useMemo(() => {
    return new Set(contracts.map((contract) => contract.plan.trim()).filter(Boolean)).size
  }, [contracts])

  const latestContract = contracts[0]

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    const cleanFullName = fullName.trim()
    const cleanUsername = username.trim()
    const cleanPassword = password.trim()
    const cleanActivationDate = activationDate.trim()
    const cleanPlan = plan.trim()

    if (!cleanFullName || !cleanUsername || !cleanPassword || !cleanActivationDate || !cleanPlan) return

    setIsSaving(true)

    try {
      const response = await fetch("/api/contratos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: cleanFullName,
          username: cleanUsername,
          password: cleanPassword,
          activationDate: cleanActivationDate,
          plan: cleanPlan,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/contrato/login?next=/admin")
          return
        }

        const data = await response.json().catch(() => null)
        setError(data?.error ?? "Nao foi possivel salvar o contrato.")
        return
      }

      const data = await response.json()
      setContracts((currentContracts) => [data.contract, ...currentContracts])
    } catch {
      setError("Nao foi possivel salvar o contrato.")
      return
    } finally {
      setIsSaving(false)
    }

    setFullName("")
    setUsername("")
    setPassword("")
    setActivationDate("")
    setPlan("")
  }

  const deleteContract = async (contractId: string) => {
    setError("")

    try {
      const response = await fetch(`/api/contratos?id=${encodeURIComponent(contractId)}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/contrato/login?next=/admin")
          return
        }

        setError("Nao foi possivel remover o contrato.")
        return
      }

      setContracts((currentContracts) => currentContracts.filter((contract) => contract.id !== contractId))
    } catch {
      setError("Nao foi possivel remover o contrato.")
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_42%,oklch(0.92_0_0)_100%)] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_42%,oklch(0.92_0_0)_100%)]" />
      <div className="gradient-glow gradient-glow-1" style={{ top: "-220px", left: "-180px" }} />
      <div className="gradient-glow gradient-glow-2" style={{ top: "160px", right: "-220px" }} />
      <div className="gradient-glow gradient-glow-3" style={{ bottom: "-260px", left: "25%" }} />

      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-sidebar-border/40 bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_58%,oklch(0.92_0_0)_100%)] lg:flex lg:flex-col">
          <div className="flex h-[73px] flex-col justify-center border-b border-border/60 px-6">
            <p className="text-sm font-semibold text-foreground">Synex Brasil</p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            <button className="group flex w-full items-center justify-between gap-3 rounded-xl bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.94_0_0)_58%,oklch(0.90_0_0)_100%)] px-3 py-3 text-sm font-medium text-sidebar-accent-foreground shadow-md shadow-foreground/5 transition-all duration-200">
              <span className="flex min-w-0 items-center gap-3">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">Contratos</span>
              </span>
              <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                {contracts.length}
              </span>
            </button>
          </nav>

        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-border/60 bg-transparent px-4 backdrop-blur lg:px-8">
            <div className="h-[73px]" />
          </header>

          <div className="space-y-6 p-4 lg:p-8" style={{ animation: "synex-fade-in-up 420ms ease-out both" }}>
            <section className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.96_0_0)_58%,oklch(0.93_0_0)_100%)] p-4 shadow-sm">
                <p className="text-xs font-medium text-muted-foreground">Contratos</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{contracts.length}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.96_0_0)_58%,oklch(0.93_0_0)_100%)] p-4 shadow-sm">
                <p className="text-xs font-medium text-muted-foreground">Planos cadastrados</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{totalPlans}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.96_0_0)_58%,oklch(0.93_0_0)_100%)] p-4 shadow-sm">
                <p className="text-xs font-medium text-muted-foreground">Ultimo contrato</p>
                <p className="mt-2 truncate text-lg font-semibold text-foreground">{latestContract?.fullName ?? "Nenhum"}</p>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
              <form id="novo-contrato" onSubmit={handleSubmit} className="rounded-lg border border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.97_0_0)_50%,oklch(0.94_0_0)_100%)] p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-base font-semibold text-foreground">Novo contrato</h2>
                </div>

                <div className="mt-5 space-y-4">
                  <AdminField label="Nome completo" value={fullName} onChange={setFullName} placeholder="Nome do cliente" />
                  <AdminField label="Usuario" value={username} onChange={setUsername} placeholder="Usuario de acesso" />
                  <AdminField label="Senha" value={password} onChange={setPassword} placeholder="Senha de acesso" type="password" />
                  <AdminField label="Data de ativação" value={activationDate} onChange={(value) => setActivationDate(formatActivationDate(value))} placeholder="dd/mm/aaaa" inputMode="numeric" maxLength={10} />
                  <AdminField label="Plano" value={plan} onChange={setPlan} placeholder="Mensal, Trimestral ou Anual" />

                  {error && <p className="text-sm font-medium text-destructive">{error}</p>}

                  <Button type="submit" className="h-11 w-full rounded-lg bg-foreground text-background hover:bg-foreground/90" disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Salvar contrato"}
                  </Button>
                </div>
              </form>

              <section className="min-w-0 rounded-lg border border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.97_0_0)_50%,oklch(0.94_0_0)_100%)] shadow-sm">
                <div className="flex flex-col gap-3 border-b border-border/70 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Contratos</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isLoadingContracts ? "Carregando contratos..." : "Gerencie os acessos cadastrados."}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative min-w-0 flex-1 lg:w-72">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="h-10 rounded-lg bg-card pl-9"
                        placeholder="Buscar contrato"
                        type="search"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-lg bg-card"
                      onClick={() => setShowPasswords((visible) => !visible)}
                      aria-label={showPasswords ? "Ocultar senhas" : "Mostrar senhas"}
                    >
                      {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[58rem] text-left text-sm">
                    <thead className="border-b border-border/70 bg-muted/30 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="w-72 px-4 py-3 font-semibold">Nome completo</th>
                        <th className="px-4 py-3 font-semibold">Usuario</th>
                        <th className="px-4 py-3 font-semibold">Senha</th>
                        <th className="px-4 py-3 font-semibold">Ativação</th>
                        <th className="px-4 py-3 font-semibold">Plano</th>
                        <th className="sticky right-0 w-24 bg-muted px-3 py-3 text-right font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody className={cn(isLoadingContracts && "animate-pulse")}>
                      {isLoadingContracts ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <tr key={`loading-contract-${index}`} className="border-b border-border/50 last:border-0">
                            <td className="px-4 py-4">
                              <div className="h-4 w-44 rounded-full bg-muted" />
                            </td>
                            <td className="px-4 py-4">
                              <div className="h-4 w-28 rounded-full bg-muted" />
                            </td>
                            <td className="px-4 py-4">
                              <div className="h-4 w-24 rounded-full bg-muted" />
                            </td>
                            <td className="px-4 py-4">
                              <div className="h-4 w-20 rounded-full bg-muted" />
                            </td>
                            <td className="px-4 py-4">
                              <div className="h-6 w-24 rounded-full bg-muted" />
                            </td>
                            <td className="sticky right-0 bg-[oklch(0.97_0_0)] px-3 py-4">
                              <div className="ml-auto h-9 w-9 rounded-lg bg-muted" />
                            </td>
                          </tr>
                        ))
                      ) : filteredContracts.map((contract) => (
                        <tr key={contract.id} className="border-b border-border/50 last:border-0">
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">{contract.fullName}</td>
                          <td className="px-4 py-3 text-muted-foreground">{contract.username}</td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{showPasswords ? contract.password : "********"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{contract.activationDate || "Nao informado"}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full bg-foreground/10 px-2.5 py-1 text-xs font-semibold text-foreground">
                              {contract.plan || "Nao informado"}
                            </span>
                          </td>
                          <td className="sticky right-0 bg-[oklch(0.97_0_0)] px-3 py-3 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg bg-foreground text-background hover:bg-foreground/85 hover:text-background"
                              onClick={() => deleteContract(contract.id)}
                              aria-label="Remover contrato"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {!isLoadingContracts && filteredContracts.length === 0 && (
                    <div className="flex min-h-60 items-center justify-center p-8 text-center">
                      <div>
                        <p className="font-semibold text-foreground">Nenhum contrato encontrado</p>
                        <p className="mt-1 text-sm text-muted-foreground">Cadastre um contrato para iniciar a base.</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}

function AdminField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search"
  maxLength?: number
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn("mt-1 h-11 rounded-lg bg-card", type === "password" && "font-mono")}
        placeholder={placeholder}
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
      />
    </label>
  )
}

function formatActivationDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8)

  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}
