"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Eye, EyeOff } from "lucide-react"
import { LOGIN_RETURN_FLAG } from "@/components/clear-login-return-flag"


export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    sessionStorage.setItem(LOGIN_RETURN_FLAG, "true")
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    if (username && password) {
      sessionStorage.setItem("iptv_username", username)
      sessionStorage.setItem("iptv_password", password)
      router.replace("/dashboard")
    } else {
      setError("Por favor, preencha todos os campos.")
      setIsLoading(false)
    }
  }

  return (
    <>
      <main className="min-h-screen overflow-hidden relative flex flex-col items-center justify-center pt-16 pb-8">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-background to-muted/30 pointer-events-none" />
        {/* Gradient glow effects */}
        <div className="gradient-glow gradient-glow-1" style={{ top: '-200px', left: '-150px' }} />
        <div className="gradient-glow gradient-glow-2" style={{ top: '300px', right: '-200px' }} />
        <div className="relative z-10 w-full max-w-md px-4" style={{ maxHeight: '75vh' }}>
          <Card 
            className="border-border/50 shadow-xl"
            style={{ animation: "synex-fade-in-up 420ms ease-out both" }}
          >
            <CardHeader className="text-center pb-2">
              <CardTitle 
                className="text-2xl font-bold text-foreground"
              >
                Acessar Painel
              </CardTitle>
              <p 
                className="text-sm text-muted-foreground mt-2"
              >
                Entre com suas credenciais para assistir ao vivo
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
                      onChange={(e) => setUsername(e.target.value)}
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
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-12 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </Field>
                </FieldGroup>
                {error && (
                  <p className="text-sm text-destructive mt-4 text-center animate-fade-in-down">
                    {error}
                  </p>
                )}
                <div className="mt-6">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 text-base shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Spinner className="h-5 w-5" />
                        <span>Entrando...</span>
                      </div>
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
    </>
  )
}
