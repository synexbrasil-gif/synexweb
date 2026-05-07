import { NextResponse } from "next/server"

import { createContractFromApprovedPayment, getMercadoPagoIntegration } from "@/lib/contracts-db"

type MercadoPagoPaymentResponse = {
  id?: number
  status?: string
  metadata?: {
    full_name?: string
    plan_name?: string
  }
  payer?: {
    first_name?: string
    last_name?: string
  }
  message?: string
}

function getActivationDate() {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date())
}

export async function GET(request: Request) {
  const paymentId = new URL(request.url).searchParams.get("id")?.trim()

  if (!paymentId) {
    return NextResponse.json({ error: "Pagamento não informado." }, { status: 400 })
  }

  const integration = await getMercadoPagoIntegration().catch(() => null)
  const accessToken = integration?.accessToken || process.env.MERCADO_PAGO_ACCESS_TOKEN

  if (!accessToken) {
    return NextResponse.json({ error: "Pagamento Pix indisponível no momento." }, { status: 500 })
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  })

  const data = (await response.json()) as MercadoPagoPaymentResponse

  if (!response.ok) {
    return NextResponse.json(
      { error: data.message ?? "Não foi possível consultar o pagamento." },
      { status: response.status },
    )
  }

  let contract = null

  if (data.status === "approved") {
    const fullName = data.metadata?.full_name || `${data.payer?.first_name ?? ""} ${data.payer?.last_name ?? ""}`.trim()
    const plan = data.metadata?.plan_name || "Mensal"

    contract = await createContractFromApprovedPayment({
      paymentId,
      fullName: fullName || "Cliente",
      plan,
      activationDate: getActivationDate(),
    })
  }

  return NextResponse.json({
    id: data.id,
    status: data.status,
    approved: data.status === "approved",
    contract,
  })
}
