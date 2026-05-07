import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { findContractByPaymentId } from "@/lib/contracts-db"

type PedidoPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function PedidoPage({ params }: PedidoPageProps) {
  const { id } = await params
  const paymentId = decodeURIComponent(id)
  const contract = await findContractByPaymentId(paymentId).catch(() => null)

  if (!contract) {
    redirect("/checkout")
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_42%,oklch(0.91_0_0)_100%)] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_42%,oklch(0.91_0_0)_100%)]" />
      <div className="gradient-glow gradient-glow-1" style={{ top: "-260px", left: "-220px" }} />
      <div className="gradient-glow gradient-glow-2" style={{ top: "120px", right: "-260px" }} />
      <div className="gradient-glow gradient-glow-3" style={{ bottom: "-280px", left: "20%" }} />

      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div
          className="w-full max-w-3xl rounded-3xl border border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.97_0_0)_48%,oklch(0.93_0_0)_100%)] p-5 shadow-2xl shadow-foreground/10 sm:p-8"
          style={{ animation: "synex-fade-in-up 420ms ease-out both" }}
        >
          <div className="border-b border-border/70 pb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">SYNEX BRASIL</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">Meu contrato</h1>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs font-medium text-muted-foreground">Cliente</p>
              <p className="mt-2 truncate text-lg font-semibold text-foreground">{contract.fullName}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs font-medium text-muted-foreground">Plano</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{contract.plan}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs font-medium text-muted-foreground">Ativação</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{contract.activationDate}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs font-medium text-muted-foreground">Referência</p>
              <p className="mt-2 truncate font-mono text-sm font-semibold text-foreground">{paymentId}</p>
            </div>
          </div>

          <div className="mt-7 flex justify-center">
            <Button type="button" className="h-12 rounded-xl bg-foreground px-10 text-base text-background hover:bg-foreground/90">
              Ver credenciais
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
