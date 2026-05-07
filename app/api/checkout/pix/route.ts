import { NextResponse } from "next/server"

import { getMercadoPagoIntegration } from "@/lib/contracts-db"

const plans = {
  mensal: {
    name: "Mensal",
    amount: 29.9,
  },
  trimestral: {
    name: "Trimestral",
    amount: 49.9,
  },
  anual: {
    name: "Anual",
    amount: 99.9,
  },
}

type PlanId = keyof typeof plans

type PixCheckoutInput = {
  fullName?: string
  phone?: string
  planId?: string
}

type MercadoPagoPixResponse = {
  id?: number
  status?: string
  status_detail?: string
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string
      qr_code_base64?: string
      ticket_url?: string
    }
  }
  message?: string
}

export async function POST(request: Request) {
  const integration = await getMercadoPagoIntegration().catch(() => null)
  const accessToken = integration?.accessToken || process.env.MERCADO_PAGO_ACCESS_TOKEN

  if (!accessToken) {
    return NextResponse.json({ error: "Pagamento Pix indisponível no momento." }, { status: 500 })
  }

  const input = (await request.json()) as PixCheckoutInput
  const fullName = input.fullName?.trim()
  const phoneDigits = input.phone?.replace(/\D/g, "") ?? ""
  const planId = input.planId as PlanId
  const plan = plans[planId]

  if (!fullName || fullName.length < 3) {
    return NextResponse.json({ error: "Informe seu nome completo." }, { status: 400 })
  }

  if (phoneDigits.length < 10) {
    return NextResponse.json({ error: "Informe um telefone válido." }, { status: 400 })
  }

  if (!plan) {
    return NextResponse.json({ error: "Plano inválido." }, { status: 400 })
  }

  const [firstName, ...lastNameParts] = fullName.split(/\s+/)
  const areaCode = phoneDigits.slice(0, 2)
  const phoneNumber = phoneDigits.slice(2)
  const payerEmail = `cliente+${phoneDigits}@synexbr.com`

  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      transaction_amount: plan.amount,
      description: `Plano ${plan.name} - Synex Brasil`,
      payment_method_id: "pix",
      payer: {
        email: payerEmail,
        first_name: firstName,
        last_name: lastNameParts.join(" ") || firstName,
        phone: {
          area_code: areaCode,
          number: phoneNumber,
        },
      },
      metadata: {
        full_name: fullName,
        phone: phoneDigits,
        plan_id: planId,
        plan_name: plan.name,
      },
    }),
  })

  const data = (await response.json()) as MercadoPagoPixResponse

  if (!response.ok) {
    return NextResponse.json(
      { error: data.message ?? "Não foi possível gerar o Pix." },
      { status: response.status },
    )
  }

  const transactionData = data.point_of_interaction?.transaction_data

  return NextResponse.json({
    id: data.id,
    status: data.status,
    statusDetail: data.status_detail,
    qrCode: transactionData?.qr_code,
    qrCodeBase64: transactionData?.qr_code_base64,
    ticketUrl: transactionData?.ticket_url,
  })
}
