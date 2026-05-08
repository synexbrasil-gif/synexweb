"use client"

import { FormEvent, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useNotification } from "@/components/notification-provider"

export default function PedidoLoginPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { notify } = useNotification()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    const cleanUsername = username.trim()
    const cleanPassword = password.trim()

    if (!cleanUsername || !cleanPassword) {
      const message = "Informe o usuário e a senha que deseja usar."
      setError(message)
      notify({ title: "Dados incompletos", description: message, tone: "error" })
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch("/api/pedido-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId: decodeURIComponent(params.id),
          username: cleanUsername,
          password: cleanPassword,
        }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const message = data?.error ?? "Não foi possível ativar seu login."
        setError(message)
        notify({ title: "Login não ativado", description: message, tone: "error" })
        return
      }

      notify({
        title: "Login ativado",
        description: "Suas credenciais foram salvas com sucesso.",
        tone: "success",
      })
      router.replace(`/pedido/${encodeURIComponent(params.id)}/confirmacao`)
    } catch {
      const message = "Não foi possível ativar seu login. Tente novamente."
      setError(message)
      notify({ title: "Erro ao ativar", description: message, tone: "error" })
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
          <CardTitle className="text-2xl font-bold text-foreground">Ativar credenciais</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Escolha o usuário e a senha que você usará para entrar no player.
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Usuário</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="Digite seu usuário"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={isSaving}
                  className="h-12"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Senha</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
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

            {error && <p className="mt-4 text-center text-sm text-destructive">{error}</p>}

            <Button type="submit" size="lg" className="mt-6 h-12 w-full text-base" disabled={isSaving}>
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-5 w-5" />
                  Salvando...
                </span>
              ) : (
                "Salvar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
