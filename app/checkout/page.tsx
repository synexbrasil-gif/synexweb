"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { useNotification } from "@/components/notification-provider"
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
  const router = useRouter()
  const { notify } = useNotification()
  const [selectedPlan, setSelectedPlan] = useState(plans[0].id)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isGeneratingPix, setIsGeneratingPix] = useState(false)
  const [pixError, setPixError] = useState("")
  const [pixPayment, setPixPayment] = useState<{
    id?: number
    status?: string
    qrCode?: string
    qrCodeBase64?: string
    ticketUrl?: string
  } | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const plan = params.get("plano")?.toLowerCase()
    const matchedPlan = plans.find((item) => item.id === plan || item.name.toLowerCase() === plan)

    if (matchedPlan) {
      setSelectedPlan(matchedPlan.id)
    }
  }, [])

  const canSubmit = fullName.trim().length > 2 && phone.replace(/\D/g, "").length >= 10

  useEffect(() => {
    if (!pixPayment?.id) return

    let isMounted = true

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/checkout/pix/status?id=${encodeURIComponent(String(pixPayment.id))}`, {
          cache: "no-store",
        })
        const data = await response.json()

        if (!isMounted || !response.ok) return

        if (data.approved) {
          router.replace(`/pedido/${encodeURIComponent(String(pixPayment.id))}`)
        }
      } catch {
        return
      }
    }

    checkPaymentStatus()
    const intervalId = window.setInterval(checkPaymentStatus, 5000)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
    }
  }, [pixPayment?.id, router])

  const copyPixCode = async () => {
    if (!pixPayment?.qrCode) return

    await navigator.clipboard.writeText(pixPayment.qrCode)
    notify({ title: "Código copiado", description: "O código Pix foi copiado.", tone: "success" })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    setPixError("")
    setPixPayment(null)

    if (!canSubmit) {
      notify({ title: "Dados incompletos", description: "Preencha seu nome completo e telefone.", tone: "error" })
      return
    }

    setIsGeneratingPix(true)

    try {
      const response = await fetch("/api/checkout/pix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          phone,
          planId: selectedPlan,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const message = data?.error ?? "Não foi possível gerar o Pix."
        setPixError(message)
        notify({ title: "Pix não gerado", description: message, tone: "error" })
        return
      }

      setPixPayment(data)
      notify({ title: "Pix gerado", description: "Use o QR Code ou copie o código para pagar.", tone: "success" })
    } catch {
      setPixError("Não foi possível gerar o Pix.")
      notify({ title: "Pix não gerado", description: "Tente novamente em alguns instantes.", tone: "error" })
    } finally {
      setIsGeneratingPix(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_42%,oklch(0.91_0_0)_100%)] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_42%,oklch(0.91_0_0)_100%)]" />
      <div className="gradient-glow gradient-glow-1" style={{ top: "-260px", left: "-220px" }} />
      <div className="gradient-glow gradient-glow-2" style={{ top: "120px", right: "-260px" }} />
      <div className="gradient-glow gradient-glow-3" style={{ bottom: "-280px", left: "20%" }} />

      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.97_0_0)_50%,oklch(0.93_0_0)_100%)] p-5 shadow-xl shadow-foreground/5 sm:p-7"
            style={{ animation: "synex-fade-in-up 420ms ease-out both" }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Checkout</p>
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
                  label="Nome completo"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Digite seu nome completo"
                  error={submitted && fullName.trim().length <= 2 ? "Informe seu nome completo." : ""}
                />
                <CheckoutField
                  label="Numero de telefone"
                  value={phone}
                  onChange={(value) => setPhone(formatPhone(value))}
                  placeholder="(00) 00000-0000"
                  inputMode="tel"
                  maxLength={15}
                  error={submitted && phone.replace(/\D/g, "").length < 10 ? "Informe um telefone valido." : ""}
                />
              </div>

              {pixError && <p className="text-sm font-medium text-destructive">{pixError}</p>}

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-foreground text-base text-background hover:bg-foreground/90"
                disabled={isGeneratingPix}
              >
                {isGeneratingPix ? "Gerando Pix..." : "Gerar Pix"}
              </Button>

              {pixPayment && (
                <div className="space-y-4 rounded-xl border border-border/70 bg-background/60 p-4" style={{ animation: "synex-fade-in-up 360ms ease-out both" }}>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Pix gerado</p>
                    <p className="mt-1 text-xs text-muted-foreground">Use o QR Code ou copie o código Pix para pagar.</p>
                  </div>

                  {pixPayment.qrCodeBase64 && (
                    <div className="flex justify-center">
                      <div className="flex h-56 w-56 items-center justify-center">
                        <img
                          src={`data:image/png;base64,${pixPayment.qrCodeBase64}`}
                          alt="QR Code Pix"
                          className="h-full w-full object-contain mix-blend-multiply"
                        />
                      </div>
                    </div>
                  )}

                  {pixPayment.qrCode && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground" htmlFor="pix-code">
                        Código Pix copia e cola
                      </label>
                      <textarea
                        id="pix-code"
                        readOnly
                        value={pixPayment.qrCode}
                        className="mt-2 min-h-24 w-full resize-none rounded-xl border border-border/70 bg-background/80 p-3 text-xs text-foreground outline-none"
                      />
                    </div>
                  )}

                  <Button type="button" className="h-11 w-full rounded-xl bg-foreground text-background hover:bg-foreground/90" onClick={copyPixCode}>
                    Copiar código
                  </Button>
                </div>
              )}
            </div>
          </form>

        </div>
      </section>
    </main>
  )
}

function CheckoutField({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  maxLength,
  error,
}: {
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
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
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
