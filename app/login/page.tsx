"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useNotification } from "@/components/notification-provider"
import { LOGIN_RETURN_FLAG } from "@/components/clear-login-return-flag"

export default function LoginPage() {
  const router = useRouter()
  const { notify } = useNotification()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [rememberSession, setRememberSession] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const loginWithCredentials = async (loginUsername: string, loginPassword: string, remember: boolean) => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/assinante", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      })
      const data = await response.json()

      if (data?.iptvUsername && data?.iptvPassword) {
        if (String(data.iptvUsername).trim() === "0") {
          sessionStorage.setItem("iptv_username", loginUsername)
          sessionStorage.setItem("iptv_password", loginPassword)
        } else {
          sessionStorage.setItem("iptv_username", data.iptvUsername)
          sessionStorage.setItem("iptv_password", data.iptvPassword)
        }
      } else if (data?.fullName) {
        sessionStorage.setItem("iptv_username", loginUsername)
        sessionStorage.setItem("iptv_password", loginPassword)
      } else {
        notify({ title: "Acesso negado", description: "Usuario ou senha invalidos.", tone: "error" })
        setIsLoading(false)
        return
      }

      sessionStorage.removeItem("synex_payment_id")

      if (remember) {
        localStorage.setItem("synex_remember_session", "true")
        localStorage.setItem("synex_login_username", loginUsername)
        localStorage.setItem("synex_login_password", loginPassword)
      } else {
        localStorage.removeItem("synex_remember_session")
        localStorage.removeItem("synex_login_username")
        localStorage.removeItem("synex_login_password")
      }

      router.replace("/contrato")
    } catch {
      notify({ title: "Erro no login", description: "Nao foi possivel entrar. Tente novamente.", tone: "error" })
      setIsLoading(false)
    }
  }

  useEffect(() => {
    sessionStorage.setItem(LOGIN_RETURN_FLAG, "true")
  }, [])

  useEffect(() => {
    const remembered = localStorage.getItem("synex_remember_session") === "true"
    const rememberedUsername = localStorage.getItem("synex_login_username") ?? ""
    const rememberedPassword = localStorage.getItem("synex_login_password") ?? ""

    setRememberSession(remembered)
    setUsername(rememberedUsername)
    setPassword(rememberedPassword)

    if (remembered && rememberedUsername && rememberedPassword) {
      void loginWithCredentials(rememberedUsername, rememberedPassword, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const cleanUsername = username.trim()
    const cleanPassword = password.trim()

    if (!cleanUsername || !cleanPassword) {
      notify({ title: "Dados incompletos", description: "Por favor, preencha todos os campos.", tone: "error" })
      return
    }

    void loginWithCredentials(cleanUsername, cleanPassword, rememberSession)
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pb-8 pt-16">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/50 via-background to-muted/30" />
      <div className="gradient-glow gradient-glow-1" style={{ top: "-200px", left: "-150px" }} />
      <div className="gradient-glow gradient-glow-2" style={{ top: "300px", right: "-200px" }} />
      <div className="relative z-10 w-full max-w-md px-4" style={{ maxHeight: "75vh" }}>
        <Card className="border-border/50 shadow-xl" style={{ animation: "synex-fade-in-up 420ms ease-out both" }}>
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-2xl font-bold text-foreground">Acessar Painel</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">Entre com suas credenciais para assistir ao vivo</p>
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
                    disabled={isLoading}
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
                      disabled={isLoading}
                      className="h-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </Field>
              </FieldGroup>

              <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={rememberSession}
                  onCheckedChange={(checked) => setRememberSession(checked === true)}
                  disabled={isLoading}
                />
                <span>Lembrar sessão</span>
              </label>

              <div className="mt-6">
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full text-base shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="h-5 w-5" />
                      Entrando...
                    </span>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
