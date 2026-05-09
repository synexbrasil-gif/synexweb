"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Menu,
  Eye,
  EyeOff,
  CreditCard,
  FileText,
  KeyRound,
  Pencil,
  Plug,
  Search,
  Trash2,
  UserCog,
  UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNotification } from "@/components/notification-provider"
import { cn } from "@/lib/utils"

type Contract = {
  id: string
  fullName: string
  username: string
  password: string
  loginUsername?: string | null
  loginPassword?: string | null
  activationDate: string
  plan: string
  createdAt: string
}

type MercadoPagoIntegration = {
  publicKey: string
  accessToken: string
  clientId: string
  clientSecret: string
  updatedAt: string | null
}

type Plan = {
  id: string
  name: string
  price: number
  description: string
  updatedAt: string | null
}

type AdminUser = {
  id: string
  fullName: string
  username: string
  password: string
  role: string
  createdAt: string
}

type AdminSession = {
  fullName: string
  role: string
}

type AdminSection = "contracts" | "logins" | "plans" | "integrations" | "admins"

function parseCurrencyValue(value: string) {
  const price = value.trim()
  if (!price) return Number.NaN

  if (price.includes(",")) {
    return Number(price.replace(/\./g, "").replace(",", "."))
  }

  return Number(price)
}

export default function AdminPage() {
  const router = useRouter()
  const { notify } = useNotification()
  const [activeSection, setActiveSection] = useState<AdminSection>("contracts")
  const [panelOpen, setPanelOpen] = useState(false)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [credentialDrafts, setCredentialDrafts] = useState<Record<string, { username: string; password: string }>>({})
  const [savingCredentialId, setSavingCredentialId] = useState<string | null>(null)
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [activationDate, setActivationDate] = useState("")
  const [plan, setPlan] = useState("")
  const [editingContractId, setEditingContractId] = useState<string | null>(null)
  const [showPasswords, setShowPasswords] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingContracts, setIsLoadingContracts] = useState(true)
  const [error, setError] = useState("")
  const [mercadoPagoPublicKey, setMercadoPagoPublicKey] = useState("")
  const [mercadoPagoAccessToken, setMercadoPagoAccessToken] = useState("")
  const [mercadoPagoClientId, setMercadoPagoClientId] = useState("")
  const [mercadoPagoClientSecret, setMercadoPagoClientSecret] = useState("")
  const [mercadoPagoUpdatedAt, setMercadoPagoUpdatedAt] = useState<string | null>(null)
  const [isLoadingIntegration, setIsLoadingIntegration] = useState(true)
  const [isSavingIntegration, setIsSavingIntegration] = useState(false)
  const [integrationMessage, setIntegrationMessage] = useState("")
  const [plans, setPlans] = useState<Plan[]>([])
  const [planPrices, setPlanPrices] = useState<Record<string, string>>({})
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)
  const [isSavingPlans, setIsSavingPlans] = useState(false)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [adminFullName, setAdminFullName] = useState("")
  const [adminUsername, setAdminUsername] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [adminRole, setAdminRole] = useState("")
  const [isLoadingAdminUsers, setIsLoadingAdminUsers] = useState(true)
  const [isSavingAdminUser, setIsSavingAdminUser] = useState(false)
  const [adminError, setAdminError] = useState("")
  const [currentAdmin, setCurrentAdmin] = useState<AdminSession>({ fullName: "Synex Brasil", role: "" })
  const [isLoadingAdminSession, setIsLoadingAdminSession] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const canManageAdminUsers = ["admin", "ceo"].includes(currentAdmin.role.trim().toLowerCase())
  const canAccessFullAdmin = canManageAdminUsers

  const selectSection = (section: AdminSection) => {
    setActiveSection(section)
    setPanelOpen(false)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await fetch("/api/contrato-auth", { method: "DELETE" })
      router.replace("/")
    } catch {
      notify({ title: "Nao foi possivel sair", description: "Tente novamente em alguns instantes.", tone: "error" })
      setIsLoggingOut(false)
    }
  }

  useEffect(() => {
    const loadAdminSession = async () => {
      setIsLoadingAdminSession(true)

      try {
        const response = await fetch("/api/contrato-auth", { cache: "no-store" })
        if (response.status === 401) {
          router.replace("/contrato/login?next=/admin")
          return
        }

        if (!response.ok) return

        const data = await response.json()
        if (data.admin?.fullName && data.admin?.role) {
          setCurrentAdmin({
            fullName: data.admin.fullName,
            role: data.admin.role,
          })
        }
      } finally {
        setIsLoadingAdminSession(false)
      }
    }

    loadAdminSession()
  }, [router])

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
          setCredentialDrafts(
            Object.fromEntries(
              (data.contracts as Contract[]).map((contract) => [
                contract.id,
                {
                  username: contract.loginUsername ?? "",
                  password: contract.loginPassword ?? "",
                },
              ]),
            ),
          )
        }
      } catch {
        setError("Nao foi possivel carregar os contratos.")
      } finally {
        setIsLoadingContracts(false)
      }
    }

    loadContracts()
  }, [router])

  useEffect(() => {
    const loadIntegration = async () => {
      setIsLoadingIntegration(true)

      try {
        const response = await fetch("/api/integracoes/mercado-pago", { cache: "no-store" })
        if (response.status === 401) {
          router.replace("/contrato/login?next=/admin")
          return
        }

        if (!response.ok) return

        const data = await response.json()
        const integration = data.integration as MercadoPagoIntegration | null

        if (integration) {
          setMercadoPagoPublicKey(integration.publicKey)
          setMercadoPagoAccessToken(integration.accessToken)
          setMercadoPagoClientId(integration.clientId)
          setMercadoPagoClientSecret(integration.clientSecret)
          setMercadoPagoUpdatedAt(integration.updatedAt)
        }
      } finally {
        setIsLoadingIntegration(false)
      }
    }

    loadIntegration()
  }, [router])

  useEffect(() => {
    const loadPlans = async () => {
      setIsLoadingPlans(true)

      try {
        const response = await fetch("/api/planos", { cache: "no-store" })
        if (!response.ok) return

        const data = await response.json()
        if (!Array.isArray(data.plans)) return

        const loadedPlans = data.plans as Plan[]
        setPlans(loadedPlans)
        setPlanPrices(
          Object.fromEntries(
            loadedPlans.map((plan) => [
              plan.id,
              Number(plan.price).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
            ]),
          ),
        )
      } finally {
        setIsLoadingPlans(false)
      }
    }

    loadPlans()
  }, [])

  useEffect(() => {
    const loadAdminUsers = async () => {
      if (!canManageAdminUsers) {
        setAdminUsers([])
        setIsLoadingAdminUsers(false)
        return
      }

      setIsLoadingAdminUsers(true)

      try {
        const response = await fetch("/api/admin-users", { cache: "no-store" })
        if (response.status === 401) {
          router.replace("/contrato/login?next=/admin")
          return
        }

        if (!response.ok) return

        const data = await response.json()
        if (Array.isArray(data.users)) {
          setAdminUsers(data.users)
        }
      } finally {
        setIsLoadingAdminUsers(false)
      }
    }

    loadAdminUsers()
  }, [canManageAdminUsers, router])

  useEffect(() => {
    if (!canAccessFullAdmin && activeSection !== "contracts" && activeSection !== "logins") {
      setActiveSection("contracts")
    }
  }, [activeSection, canAccessFullAdmin])

  const filteredContracts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return contracts

    return contracts.filter((contract) => {
      return `${contract.fullName} ${contract.username} ${contract.plan ?? ""}`.toLowerCase().includes(query)
    })
  }, [contracts, searchQuery])

  const totalPlans = useMemo(() => {
    return contracts.filter((contract) => contract.username.trim() !== "0").length
  }, [contracts])

  const latestContract = contracts[0]
  const hasMercadoPagoIntegration = Boolean(mercadoPagoAccessToken.trim())

  const resetContractForm = () => {
    setFullName("")
    setUsername("")
    setPassword("")
    setActivationDate("")
    setPlan("")
    setEditingContractId(null)
  }

  const resetAdminUserForm = () => {
    setAdminFullName("")
    setAdminUsername("")
    setAdminPassword("")
    setAdminRole("")
    setAdminError("")
  }

  const startEditContract = (contract: Contract) => {
    setError("")
    setFullName(contract.fullName)
    setUsername(contract.username)
    setPassword(contract.password)
    setActivationDate(contract.activationDate)
    setPlan(contract.plan)
    setEditingContractId(contract.id)
  }

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
        method: editingContractId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingContractId,
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
      setContracts((currentContracts) =>
        editingContractId
          ? currentContracts.map((contract) => (contract.id === editingContractId ? data.contract : contract))
          : [data.contract, ...currentContracts],
      )
      setCredentialDrafts((currentDrafts) => ({
        ...currentDrafts,
        [data.contract.id]: {
          username: data.contract.loginUsername ?? "",
          password: data.contract.loginPassword ?? "",
        },
      }))
    } catch {
      setError("Nao foi possivel salvar o contrato.")
      return
    } finally {
      setIsSaving(false)
    }

    resetContractForm()
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
      setCredentialDrafts((currentDrafts) => {
        const nextDrafts = { ...currentDrafts }
        delete nextDrafts[contractId]
        return nextDrafts
      })
      if (editingContractId === contractId) {
        resetContractForm()
      }
    } catch {
      setError("Nao foi possivel remover o contrato.")
    }
  }

  const saveMercadoPago = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIntegrationMessage("")

    const publicKey = mercadoPagoPublicKey.trim()
    const accessToken = mercadoPagoAccessToken.trim()
    const clientId = mercadoPagoClientId.trim()
    const clientSecret = mercadoPagoClientSecret.trim()

    if (!publicKey || !accessToken || !clientId || !clientSecret) {
      setIntegrationMessage("Preencha todos os dados do Mercado Pago.")
      return
    }

    setIsSavingIntegration(true)

    try {
      const response = await fetch("/api/integracoes/mercado-pago", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicKey,
          accessToken,
          clientId,
          clientSecret,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/contrato/login?next=/admin")
          return
        }

        setIntegrationMessage(data?.error ?? "Nao foi possivel salvar a integracao.")
        return
      }

      const integration = data.integration as MercadoPagoIntegration
      setMercadoPagoUpdatedAt(integration.updatedAt)
      notify({
        title: "Integração salva",
        description: "As credenciais do Mercado Pago foram atualizadas com sucesso.",
        tone: "success",
      })
    } catch {
      setIntegrationMessage("Nao foi possivel salvar a integracao.")
    } finally {
      setIsSavingIntegration(false)
    }
  }

  const updateCredentialDraft = (contractId: string, field: "username" | "password", value: string) => {
    setCredentialDrafts((currentDrafts) => ({
      ...currentDrafts,
      [contractId]: {
        username: currentDrafts[contractId]?.username ?? "",
        password: currentDrafts[contractId]?.password ?? "",
        [field]: value,
      },
    }))
  }

  const saveContractCredentials = async (contract: Contract) => {
    const draft = credentialDrafts[contract.id] ?? {
      username: contract.loginUsername ?? "",
      password: contract.loginPassword ?? "",
    }
    const cleanUsername = draft.username.trim()
    const cleanPassword = draft.password.trim()

    if (!cleanUsername || !cleanPassword) {
      notify({ title: "Login incompleto", description: "Informe usuario e senha para o contrato.", tone: "error" })
      return
    }

    const duplicatedContract = contracts.find((currentContract) => {
      if (currentContract.id === contract.id) return false
      return (credentialDrafts[currentContract.id]?.username ?? currentContract.loginUsername ?? "")
        .trim()
        .toLowerCase() === cleanUsername.toLowerCase()
    })

    if (duplicatedContract) {
      notify({
        title: "Usuario ja usado",
        description: `Este usuario ja esta definido para ${duplicatedContract.fullName}.`,
        tone: "error",
      })
      return
    }

    setSavingCredentialId(contract.id)

    try {
      const response = await fetch("/api/contratos", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: contract.id,
          mode: "credentials",
          username: cleanUsername,
          password: cleanPassword,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/contrato/login?next=/admin")
          return
        }

        notify({ title: "Login nao salvo", description: data?.error ?? "Nao foi possivel atualizar o login.", tone: "error" })
        return
      }

      const updatedContract = data.contract as Contract
      setContracts((currentContracts) =>
        currentContracts.map((currentContract) =>
          currentContract.id === updatedContract.id ? updatedContract : currentContract,
        ),
      )
      setCredentialDrafts((currentDrafts) => ({
        ...currentDrafts,
        [updatedContract.id]: {
        username: updatedContract.loginUsername ?? "",
        password: updatedContract.loginPassword ?? "",
        },
      }))
      notify({ title: "Login salvo", description: "Usuario e senha do contrato foram atualizados.", tone: "success" })
    } catch {
      notify({ title: "Login nao salvo", description: "Nao foi possivel atualizar o login.", tone: "error" })
    } finally {
      setSavingCredentialId(null)
    }
  }

  const savePlans = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedPlans = plans.map((plan) => ({
      id: plan.id,
      price: parseCurrencyValue(planPrices[plan.id] ?? ""),
    }))

    if (normalizedPlans.some((plan) => !Number.isFinite(plan.price) || plan.price < 0.01)) {
      notify({ title: "Precos invalidos", description: "Informe valores a partir de R$ 0,01.", tone: "error" })
      return
    }

    setIsSavingPlans(true)

    try {
      const response = await fetch("/api/planos", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plans: normalizedPlans }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/contrato/login?next=/admin")
          return
        }

        notify({
          title: "Planos nao salvos",
          description: data?.error ?? "Nao foi possivel salvar os planos.",
          tone: "error",
        })
        return
      }

      const updatedPlans = data.plans as Plan[]
      setPlans(updatedPlans)
      setPlanPrices(
        Object.fromEntries(
          updatedPlans.map((plan) => [
            plan.id,
            Number(plan.price).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
          ]),
        ),
      )
      notify({ title: "Planos salvos", description: "Os precos foram atualizados com sucesso.", tone: "success" })
    } catch {
      notify({ title: "Planos nao salvos", description: "Nao foi possivel salvar os planos.", tone: "error" })
    } finally {
      setIsSavingPlans(false)
    }
  }

  const saveAdminUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAdminError("")

    const cleanFullName = adminFullName.trim()
    const cleanUsername = adminUsername.trim()
    const cleanPassword = adminPassword.trim()
    const cleanRole = adminRole.trim()

    if (!cleanFullName || !cleanUsername || !cleanPassword || !cleanRole) {
      setAdminError("Preencha todos os campos.")
      return
    }

    setIsSavingAdminUser(true)

    try {
      const response = await fetch("/api/admin-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: cleanFullName,
          username: cleanUsername,
          password: cleanPassword,
          role: cleanRole,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/contrato/login?next=/admin")
          return
        }

        setAdminError(data?.error ?? "Nao foi possivel salvar o usuario.")
        return
      }

      setAdminUsers((currentUsers) => [data.user, ...currentUsers])
      resetAdminUserForm()
      notify({ title: "Usuario salvo", description: "O acesso ao painel admin foi cadastrado.", tone: "success" })
    } catch {
      setAdminError("Nao foi possivel salvar o usuario.")
    } finally {
      setIsSavingAdminUser(false)
    }
  }

  const removeAdminUser = async (adminUserId: string) => {
    setAdminError("")

    try {
      const response = await fetch(`/api/admin-users?id=${encodeURIComponent(adminUserId)}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/contrato/login?next=/admin")
          return
        }

        notify({ title: "Usuario nao removido", description: "Nao foi possivel remover o acesso.", tone: "error" })
        return
      }

      setAdminUsers((currentUsers) => currentUsers.filter((user) => user.id !== adminUserId))
      notify({ title: "Usuario removido", description: "O acesso ao painel admin foi removido.", tone: "success" })
    } catch {
      notify({ title: "Usuario nao removido", description: "Nao foi possivel remover o acesso.", tone: "error" })
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_42%,oklch(0.92_0_0)_100%)] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_42%,oklch(0.92_0_0)_100%)]" />
      <div className="gradient-glow gradient-glow-1" style={{ top: "-220px", left: "-180px" }} />
      <div className="gradient-glow gradient-glow-2" style={{ top: "160px", right: "-220px" }} />
      <div className="gradient-glow gradient-glow-3" style={{ bottom: "-260px", left: "25%" }} />

      <div className="relative z-10 flex min-h-screen">
        {panelOpen && (
          <div
            className="fixed inset-x-0 bottom-0 top-[73px] z-30 bg-foreground/20 lg:hidden"
            onClick={() => setPanelOpen(false)}
          />
        )}

        <aside
          className={cn(
            "fixed bottom-0 left-0 top-[73px] z-40 flex w-72 max-w-[calc(100vw-2rem)] shrink-0 flex-col overflow-hidden border-r border-sidebar-border/40 bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_58%,oklch(0.92_0_0)_100%)] transition-transform duration-300 ease-out lg:top-0 lg:h-screen lg:max-w-none lg:translate-x-0",
            panelOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-[73px] shrink-0 items-center gap-3 border-b border-border/60 px-6">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border/70 bg-background/70 text-foreground shadow-sm">
              <UserRound className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {isLoadingAdminSession ? "Carregando..." : currentAdmin.fullName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {isLoadingAdminSession ? "" : currentAdmin.role || "Admin"}
              </p>
            </div>
          </div>

          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-4">
            <button
              type="button"
              onClick={() => selectSection("contracts")}
              className={cn(
                "group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                activeSection === "contracts"
                  ? "bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.94_0_0)_58%,oklch(0.90_0_0)_100%)] text-sidebar-accent-foreground shadow-md shadow-foreground/5"
                  : "text-sidebar-foreground/70 hover:bg-white/35 hover:text-sidebar-foreground hover:shadow-sm",
              )}
            >
              <span className="flex min-w-0 items-center gap-3">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">Contratos</span>
              </span>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                activeSection === "contracts" ? "bg-foreground/10 text-foreground" : "bg-foreground/5 text-muted-foreground",
              )}>
                {contracts.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => selectSection("logins")}
              className={cn(
                "group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                activeSection === "logins"
                  ? "bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.94_0_0)_58%,oklch(0.90_0_0)_100%)] text-sidebar-accent-foreground shadow-md shadow-foreground/5"
                  : "text-sidebar-foreground/70 hover:bg-white/35 hover:text-sidebar-foreground hover:shadow-sm",
              )}
            >
              <span className="flex min-w-0 items-center gap-3">
                <KeyRound className="h-4 w-4 shrink-0" />
                <span className="truncate">Login</span>
              </span>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                activeSection === "logins" ? "bg-foreground/10 text-foreground" : "bg-foreground/5 text-muted-foreground",
              )}>
                {contracts.length}
              </span>
            </button>
            {canAccessFullAdmin && (
              <button
                type="button"
                onClick={() => selectSection("plans")}
                className={cn(
                  "group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                  activeSection === "plans"
                    ? "bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.94_0_0)_58%,oklch(0.90_0_0)_100%)] text-sidebar-accent-foreground shadow-md shadow-foreground/5"
                    : "text-sidebar-foreground/70 hover:bg-white/35 hover:text-sidebar-foreground hover:shadow-sm",
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <CreditCard className="h-4 w-4 shrink-0" />
                  <span className="truncate">Planos</span>
                </span>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  activeSection === "plans" ? "bg-foreground/10 text-foreground" : "bg-foreground/5 text-muted-foreground",
                )}>
                  {plans.length}
                </span>
              </button>
            )}
            {canAccessFullAdmin && (
              <button
                type="button"
                onClick={() => selectSection("admins")}
                className={cn(
                  "group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                  activeSection === "admins"
                    ? "bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.94_0_0)_58%,oklch(0.90_0_0)_100%)] text-sidebar-accent-foreground shadow-md shadow-foreground/5"
                    : "text-sidebar-foreground/70 hover:bg-white/35 hover:text-sidebar-foreground hover:shadow-sm",
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <UserCog className="h-4 w-4 shrink-0" />
                  <span className="truncate">Admin</span>
                </span>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  activeSection === "admins" ? "bg-foreground/10 text-foreground" : "bg-foreground/5 text-muted-foreground",
                )}>
                  {adminUsers.length}
                </span>
              </button>
            )}
            {canAccessFullAdmin && (
              <button
              type="button"
              onClick={() => selectSection("integrations")}
              className={cn(
                "group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                activeSection === "integrations"
                  ? "bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.94_0_0)_58%,oklch(0.90_0_0)_100%)] text-sidebar-accent-foreground shadow-md shadow-foreground/5"
                  : "text-sidebar-foreground/70 hover:bg-white/35 hover:text-sidebar-foreground hover:shadow-sm",
              )}
            >
              <span className="flex min-w-0 items-center gap-3">
                <Plug className="h-4 w-4 shrink-0" />
                <span className="truncate">Integrações</span>
              </span>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                activeSection === "integrations" ? "bg-foreground/10 text-foreground" : "bg-foreground/5 text-muted-foreground",
              )}>
                {hasMercadoPagoIntegration ? "1" : "0"}
              </span>
              </button>
            )}
          </nav>

          <div className="shrink-0 border-t border-border/60 p-4">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full rounded-lg bg-background/70 hover:bg-black hover:text-white"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <span>{isLoggingOut ? "Voltando..." : "Voltar"}</span>
            </Button>
          </div>
        </aside>

        <section className="min-w-0 flex-1 lg:pl-72">
          <header
            className={cn(
              "fixed left-0 right-0 top-0 z-30 border-b border-border/60 px-4 backdrop-blur transition-colors duration-300 lg:left-72 lg:px-8",
              panelOpen
                ? "bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_58%,oklch(0.92_0_0)_100%)] lg:bg-background/35"
                : "bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_42%,oklch(0.92_0_0)_100%)] lg:bg-transparent",
            )}
          >
            <div className="flex h-[73px] items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-xl lg:hidden"
                aria-label="Abrir menu admin"
                aria-expanded={panelOpen}
                onClick={() => setPanelOpen((open) => !open)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </header>

          <div key={activeSection} className="space-y-6 px-4 pb-4 pt-[calc(73px+1rem)] lg:px-8 lg:pb-8 lg:pt-[calc(73px+2rem)]" style={{ animation: "synex-fade-in-up 420ms ease-out both" }}>
            {activeSection === "contracts" ? (
            <>
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
                <div>
                  <h2 className="text-base font-semibold text-foreground">{editingContractId ? "Editar contrato" : "Novo contrato"}</h2>
                </div>

                <div className="mt-5 space-y-4">
                  <AdminField label="Nome completo" value={fullName} onChange={setFullName} placeholder="Nome do cliente" />
                  <AdminField label="Usuario" value={username} onChange={setUsername} placeholder="Usuario de acesso" />
                  <AdminField label="Senha" value={password} onChange={setPassword} placeholder="Senha de acesso" type="password" />
                  <AdminField label="Data de ativação" value={activationDate} onChange={(value) => setActivationDate(formatActivationDate(value))} placeholder="dd/mm/aaaa" inputMode="numeric" maxLength={10} />
                  <AdminField label="Plano" value={plan} onChange={setPlan} placeholder="Mensal, Trimestral ou Anual" />

                  {error && <p className="text-sm font-medium text-destructive">{error}</p>}

                  <Button type="submit" className="h-11 w-full rounded-lg bg-foreground text-background hover:bg-foreground/90" disabled={isSaving}>
                    {isSaving ? "Salvando..." : editingContractId ? "Salvar alterações" : "Salvar contrato"}
                  </Button>
                  {editingContractId && (
                    <Button type="button" variant="outline" className="h-11 w-full rounded-lg bg-background/70" onClick={resetContractForm}>
                      Cancelar edição
                    </Button>
                  )}
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
                        <th className="sticky right-0 w-28 bg-muted px-3 py-3 text-right font-semibold">Ações</th>
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
                              className="mr-2 h-9 w-9 rounded-lg bg-background text-foreground hover:bg-foreground/10"
                              onClick={() => startEditContract(contract)}
                              aria-label="Editar contrato"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
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
            </>
            ) : activeSection === "logins" ? (
            <section className="min-w-0 rounded-lg border border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.97_0_0)_50%,oklch(0.94_0_0)_100%)] shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border/70 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Login dos contratos</h2>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Defina o usuario e a senha de acesso para cada cliente.
                  </p>
                </div>

                <div className="relative min-w-0 lg:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="h-10 rounded-lg bg-card pl-9"
                    placeholder="Buscar cliente"
                    type="search"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[48rem] text-left text-sm">
                  <thead className="border-b border-border/70 bg-muted/30 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="w-72 px-4 py-3 font-semibold">Nome</th>
                      <th className="px-4 py-3 font-semibold">Usuario</th>
                      <th className="px-4 py-3 font-semibold">Senha</th>
                      <th className="w-36 px-4 py-3 text-right font-semibold">Ação</th>
                    </tr>
                  </thead>
                  <tbody className={cn(isLoadingContracts && "animate-pulse")}>
                    {isLoadingContracts ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <tr key={`loading-login-${index}`} className="border-b border-border/50 last:border-0">
                          <td className="px-4 py-4"><div className="h-4 w-44 rounded-full bg-muted" /></td>
                          <td className="px-4 py-4"><div className="h-10 w-full rounded-lg bg-muted" /></td>
                          <td className="px-4 py-4"><div className="h-10 w-full rounded-lg bg-muted" /></td>
                          <td className="px-4 py-4"><div className="ml-auto h-10 w-24 rounded-lg bg-muted" /></td>
                        </tr>
                      ))
                    ) : filteredContracts.map((contract) => {
                      const draft = credentialDrafts[contract.id] ?? {
                        username: contract.loginUsername ?? "",
                        password: contract.loginPassword ?? "",
                      }

                      return (
                        <tr key={contract.id} className="border-b border-border/50 last:border-0">
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">{contract.fullName}</td>
                          <td className="px-4 py-3">
                            <Input
                              value={draft.username}
                              onChange={(event) => updateCredentialDraft(contract.id, "username", event.target.value)}
                              className="h-10 rounded-lg bg-card"
                              placeholder="Usuario"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={draft.password}
                              onChange={(event) => updateCredentialDraft(contract.id, "password", event.target.value)}
                              className="h-10 rounded-lg bg-card font-mono"
                              placeholder="Senha"
                              type="text"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              type="button"
                              className="h-10 rounded-lg bg-foreground px-4 text-background hover:bg-foreground/90"
                              onClick={() => saveContractCredentials(contract)}
                              disabled={savingCredentialId === contract.id}
                            >
                              {savingCredentialId === contract.id ? "Salvando..." : "Salvar"}
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {!isLoadingContracts && filteredContracts.length === 0 && (
                  <div className="flex min-h-60 items-center justify-center p-8 text-center">
                    <div>
                      <p className="font-semibold text-foreground">Nenhum contrato encontrado</p>
                      <p className="mt-1 text-sm text-muted-foreground">Cadastre um contrato para definir login e senha.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
            ) : activeSection === "plans" ? (
            <section>
              <form onSubmit={savePlans} className="rounded-lg border border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.97_0_0)_50%,oklch(0.94_0_0)_100%)] p-5 shadow-sm">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Planos</h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Altere os valores exibidos no site e usados para gerar Pix no checkout.
                </p>

                <div className={cn("mt-5 grid gap-4 md:grid-cols-3", isLoadingPlans && "animate-pulse")}>
                  {plans.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border/70 bg-background/60 p-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <label className="mt-4 block">
                        <span className="text-xs font-medium text-muted-foreground">Preco</span>
                        <div className="mt-1 flex items-center rounded-lg border border-input bg-card px-3">
                          <span className="text-sm font-semibold text-muted-foreground">R$</span>
                          <Input
                            value={planPrices[item.id] ?? ""}
                            onChange={(event) => setPlanPrices((currentPrices) => ({ ...currentPrices, [item.id]: event.target.value }))}
                            className="h-11 border-0 bg-transparent pl-2 shadow-none focus-visible:ring-0"
                            placeholder="0,00"
                            inputMode="decimal"
                          />
                        </div>
                      </label>
                    </div>
                  ))}
                </div>

                <Button type="submit" className="mt-5 h-11 w-full rounded-lg bg-foreground text-background hover:bg-foreground/90" disabled={isSavingPlans || isLoadingPlans}>
                  {isSavingPlans ? "Salvando..." : "Salvar planos"}
                </Button>
              </form>
            </section>
            ) : activeSection === "admins" ? (
            <section className="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
              <form onSubmit={saveAdminUser} className="rounded-lg border border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.97_0_0)_50%,oklch(0.94_0_0)_100%)] p-4 shadow-sm">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Novo admin</h2>
                </div>

                <div className="mt-5 space-y-4">
                  <AdminField label="Nome completo" value={adminFullName} onChange={setAdminFullName} placeholder="Nome do administrador" />
                  <AdminField label="Usuario" value={adminUsername} onChange={setAdminUsername} placeholder="Usuario de acesso" />
                  <AdminField label="Senha" value={adminPassword} onChange={setAdminPassword} placeholder="Senha de acesso" type="password" />
                  <AdminField label="Cargo" value={adminRole} onChange={setAdminRole} placeholder="Administrador, Suporte..." />

                  {adminError && <p className="text-sm font-medium text-destructive">{adminError}</p>}

                  <Button type="submit" className="h-11 w-full rounded-lg bg-foreground text-background hover:bg-foreground/90" disabled={isSavingAdminUser}>
                    {isSavingAdminUser ? "Salvando..." : "Salvar admin"}
                  </Button>
                </div>
              </form>

              <section className="min-w-0 rounded-lg border border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.97_0_0)_50%,oklch(0.94_0_0)_100%)] shadow-sm">
                <div className="flex items-center justify-between border-b border-border/70 p-4">
                  <div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground">Usuários admin</h2>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isLoadingAdminUsers ? "Carregando usuários..." : "Acessos autorizados para entrar no painel."}
                    </p>
                  </div>
                  <span className="rounded-full bg-foreground/10 px-2.5 py-1 text-xs font-semibold text-foreground">
                    {adminUsers.length}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[48rem] text-left text-sm">
                    <thead className="border-b border-border/70 bg-muted/30 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="w-72 px-4 py-3 font-semibold">Nome completo</th>
                        <th className="px-4 py-3 font-semibold">Usuario</th>
                        <th className="px-4 py-3 font-semibold">Senha</th>
                        <th className="px-4 py-3 font-semibold">Cargo</th>
                        <th className="w-28 px-4 py-3 text-right font-semibold">Ação</th>
                      </tr>
                    </thead>
                    <tbody className={cn(isLoadingAdminUsers && "animate-pulse")}>
                      {isLoadingAdminUsers ? (
                        Array.from({ length: 4 }).map((_, index) => (
                          <tr key={`loading-admin-${index}`} className="border-b border-border/50 last:border-0">
                            <td className="px-4 py-4"><div className="h-4 w-44 rounded-full bg-muted" /></td>
                            <td className="px-4 py-4"><div className="h-4 w-28 rounded-full bg-muted" /></td>
                            <td className="px-4 py-4"><div className="h-4 w-24 rounded-full bg-muted" /></td>
                            <td className="px-4 py-4"><div className="h-6 w-24 rounded-full bg-muted" /></td>
                            <td className="px-4 py-4"><div className="ml-auto h-9 w-9 rounded-lg bg-muted" /></td>
                          </tr>
                        ))
                      ) : adminUsers.map((user) => (
                        <tr key={user.id} className="border-b border-border/50 last:border-0">
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">{user.fullName}</td>
                          <td className="px-4 py-3 text-muted-foreground">{user.username}</td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">********</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full bg-foreground/10 px-2.5 py-1 text-xs font-semibold text-foreground">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg bg-foreground text-background hover:bg-foreground/85 hover:text-background"
                              onClick={() => removeAdminUser(user.id)}
                              aria-label="Remover admin"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {!isLoadingAdminUsers && adminUsers.length === 0 && (
                    <div className="flex min-h-60 items-center justify-center p-8 text-center">
                      <div>
                        <p className="font-semibold text-foreground">Nenhum admin cadastrado</p>
                        <p className="mt-1 text-sm text-muted-foreground">Cadastre um usuário para liberar acesso ao painel.</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </section>
            ) : (
            <section>
              <form onSubmit={saveMercadoPago} className="rounded-lg border border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.97_0_0)_50%,oklch(0.94_0_0)_100%)] p-5 shadow-sm">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Mercado Pago</h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cadastre as credenciais usadas para gerar Pix no checkout.
                </p>

                <div className={cn("mt-5 grid gap-4 md:grid-cols-2", isLoadingIntegration && "animate-pulse")}>
                  <AdminField label="Public Key" value={mercadoPagoPublicKey} onChange={setMercadoPagoPublicKey} placeholder="APP_USR..." />
                  <AdminField label="Access Token" value={mercadoPagoAccessToken} onChange={setMercadoPagoAccessToken} placeholder="APP_USR..." type="password" />
                  <AdminField label="Client ID" value={mercadoPagoClientId} onChange={setMercadoPagoClientId} placeholder="Client ID" />
                  <AdminField label="Client Secret" value={mercadoPagoClientSecret} onChange={setMercadoPagoClientSecret} placeholder="Client Secret" type="password" />
                </div>

                {integrationMessage && (
                  <p className={cn("mt-4 text-sm font-medium", integrationMessage.includes("sucesso") ? "text-foreground" : "text-destructive")}>
                    {integrationMessage}
                  </p>
                )}

                <Button type="submit" className="mt-5 h-11 w-full rounded-lg bg-foreground text-background hover:bg-foreground/90" disabled={isSavingIntegration || isLoadingIntegration}>
                  {isSavingIntegration ? "Salvando..." : "Salvar integração"}
                </Button>
              </form>
            </section>
            )}
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
