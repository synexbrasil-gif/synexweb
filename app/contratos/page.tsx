"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Contract = {
  id: string
  fullName: string
  username: string
  password: string
  activationDate: string
  plan: string
  createdAt: string
}

export default function ContratosPage() {
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
  const [error, setError] = useState("")

  useEffect(() => {
    const loadContracts = async () => {
      try {
        const response = await fetch("/api/contratos", { cache: "no-store" })
        if (response.status === 401) {
          router.replace("/contrato/login")
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
          router.replace("/contrato/login")
          return
        }

        setError("Nao foi possivel salvar o contrato.")
        const data = await response.json().catch(() => null)
        if (data?.error) {
          setError(data.error)
        }
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
          router.replace("/contrato/login")
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
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_46%,oklch(0.92_0_0)_100%)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_46%,oklch(0.92_0_0)_100%)]" />
      <div className="gradient-glow gradient-glow-1" style={{ top: "-220px", left: "-180px" }} />
      <div className="gradient-glow gradient-glow-2" style={{ top: "180px", right: "-220px" }} />

      <div
        className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 lg:px-6"
        style={{ animation: "synex-fade-in-up 420ms ease-out both" }}
      >
        <header className="mb-8 flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-normal text-foreground">CONTRATOS</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Banco local de contratos para organizar acessos de clientes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-background/70 px-4 py-3 text-sm font-semibold shadow-sm">
              {contracts.length} {contracts.length === 1 ? "contrato" : "contratos"}
            </div>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <form
            onSubmit={handleSubmit}
            className="h-fit rounded-2xl border border-border/60 bg-background/85 p-4 shadow-xl shadow-foreground/5 backdrop-blur-xl"
          >
            <h2 className="text-base font-semibold text-foreground">Novo contrato</h2>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Nome Completo</span>
                <Input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="mt-1 h-11 rounded-xl bg-card"
                  placeholder="Nome do cliente"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Usuario</span>
                <Input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="mt-1 h-11 rounded-xl bg-card"
                  placeholder="Usuario de acesso"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Senha</span>
                <Input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1 h-11 rounded-xl bg-card"
                  placeholder="Senha de acesso"
                  type="password"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Data de ativação</span>
                <Input
                  value={activationDate}
                  onChange={(event) => setActivationDate(event.target.value)}
                  className="mt-1 h-11 rounded-xl bg-card"
                  placeholder="dd/mm/aaaa"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Plano</span>
                <Input
                  value={plan}
                  onChange={(event) => setPlan(event.target.value)}
                  className="mt-1 h-11 rounded-xl bg-card"
                  placeholder="Mensal, Trimensal ou Anual"
                />
              </label>

              {error && (
                <p className="text-sm font-medium text-destructive">{error}</p>
              )}

              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-foreground text-background hover:bg-foreground/90"
                disabled={isSaving}
              >
                {isSaving ? "Salvando..." : "Salvar contrato"}
              </Button>
            </div>
          </form>

          <section className="min-w-0 rounded-2xl border border-border/60 bg-background/85 shadow-xl shadow-foreground/5 backdrop-blur-xl">
            <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Contratos</h2>
                <p className="mt-1 text-xs text-muted-foreground">Dados salvos neste navegador.</p>
              </div>

              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-10 rounded-xl bg-card sm:w-64"
                  placeholder="Buscar contrato"
                  type="search"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-card"
                  onClick={() => setShowPasswords((visible) => !visible)}
                  aria-label={showPasswords ? "Ocultar senhas" : "Mostrar senhas"}
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[58rem] text-left text-sm">
                <thead className="border-b border-border/60 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="w-72 px-4 py-3 font-semibold">Nome Completo</th>
                    <th className="px-4 py-3 font-semibold">Usuario</th>
                    <th className="px-4 py-3 font-semibold">Senha</th>
                    <th className="px-4 py-3 font-semibold">Ativação</th>
                    <th className="px-4 py-3 font-semibold">Tipo do plano</th>
                    <th className="sticky right-0 w-24 bg-background/95 px-3 py-3 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map((contract) => (
                    <tr key={contract.id} className="border-b border-border/40 last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">{contract.fullName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{contract.username}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {showPasswords ? contract.password : "********"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{contract.activationDate || "Nao informado"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-foreground/10 px-2.5 py-1 text-xs font-semibold text-foreground">
                          {contract.plan || "Nao informado"}
                        </span>
                      </td>
                      <td className="sticky right-0 bg-background/95 px-3 py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl bg-black text-white hover:bg-black/85 hover:text-white"
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

              {filteredContracts.length === 0 && (
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
    </main>
  )
}
