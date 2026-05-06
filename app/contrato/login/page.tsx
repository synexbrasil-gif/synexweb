"use client"

import { FormEvent, useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

export default function ContratoLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/contrato-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        setError("Usuario ou senha invalidos.")
        return
      }

      const nextPath = new URLSearchParams(window.location.search).get("next")
      const allowedNextPath =
        nextPath?.startsWith("/admin") || nextPath?.startsWith("/contrato") || nextPath?.startsWith("/contratos")

      window.location.href = allowedNextPath && nextPath ? nextPath : "/admin"
    } catch {
      setError("Nao foi possivel entrar. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/50 via-background to-muted/30" />
      <div className="gradient-glow gradient-glow-1" style={{ top: "-200px", left: "-150px" }} />
      <div className="gradient-glow gradient-glow-2" style={{ top: "300px", right: "-200px" }} />

      <Card
        className="relative z-10 w-full max-w-md border-border/50 shadow-xl"
        style={{ animation: "synex-fade-in-up 420ms ease-out both" }}
      >
        <CardHeader className="pb-2 text-center">
          <CardTitle className="text-2xl font-bold text-foreground">Acessar Admin</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">Entre para gerenciar a Synex.</p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Usuario</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="Digite o usuario"
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
                    placeholder="Digite a senha"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isLoading}
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

            <Button type="submit" size="lg" className="mt-6 h-12 w-full text-base" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-5 w-5" />
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
