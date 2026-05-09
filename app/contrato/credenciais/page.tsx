"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useNotification } from "@/components/notification-provider"

export default function ContratoCredenciaisPage() {
  const router = useRouter()
  const { notify } = useNotification()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const currentUsername = sessionStorage.getItem("iptv_username")
    const currentPassword = sessionStorage.getItem("iptv_password")
    const paymentId = sessionStorage.getItem("synex_payment_id")

    if ((!currentUsername || !currentPassword) && !paymentId) {
      router.replace("/login")
    }
  }, [router])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const cleanUsername = username.trim()
    const cleanPassword = password.trim()

    if (!cleanUsername || !cleanPassword) {
      notify({ title: "Dados incompletos", description: "Informe o novo usuario e a nova senha.", tone: "error" })
      return
    }

    const currentUsername = sessionStorage.getItem("iptv_username")
    const currentPassword = sessionStorage.getItem("iptv_password")
    const paymentId = sessionStorage.getItem("synex_payment_id")

    if ((!currentUsername || !currentPassword) && !paymentId) {
      router.replace("/login")
      return
    }

    setIsSaving(true)

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
          title: "Credenciais nao alteradas",
          description: data?.error ?? "Nao foi possivel alterar suas credenciais.",
          tone: "error",
        })
        return
      }

      if (data?.contract?.iptvUsername && data?.contract?.iptvPassword) {
        sessionStorage.setItem("iptv_username", data.contract.iptvUsername)
        sessionStorage.setItem("iptv_password", data.contract.iptvPassword)
      } else {
        sessionStorage.setItem("iptv_username", cleanUsername)
        sessionStorage.setItem("iptv_password", cleanPassword)
      }

      notify({ title: "Credenciais alteradas", description: "Seu novo login foi salvo com sucesso.", tone: "success" })
      router.replace("/contrato?section=access")
    } catch {
      notify({
        title: "Credenciais nao alteradas",
        description: "Nao foi possivel alterar suas credenciais.",
        tone: "error",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_42%,oklch(0.91_0_0)_100%)] px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_42%,oklch(0.91_0_0)_100%)]" />
      <div className="gradient-glow gradient-glow-1" style={{ top: "-220px", left: "-180px" }} />
      <div className="gradient-glow gradient-glow-2" style={{ top: "160px", right: "-220px" }} />
      <div className="gradient-glow gradient-glow-3" style={{ bottom: "-260px", left: "25%" }} />

      <Card
        className="relative z-10 w-full max-w-md border-border/50 shadow-xl"
        style={{ animation: "synex-fade-in-up 420ms ease-out both" }}
      >
        <CardHeader className="pb-2 text-center">
          <CardTitle className="text-2xl font-bold text-foreground">Alterar credenciais</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">Escolha um novo usuario e uma nova senha para acessar sua conta.</p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Novo usuario</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="Digite o novo usuario"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={isSaving}
                  className="h-12"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Nova senha</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite a nova senha"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isSaving}
                    className="h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </Field>
            </FieldGroup>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button type="button" variant="outline" className="h-12" onClick={() => router.push("/contrato")}>
                Voltar
              </Button>
              <Button type="submit" className="h-12" disabled={isSaving}>
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="h-5 w-5" />
                    Salvando...
                  </span>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
