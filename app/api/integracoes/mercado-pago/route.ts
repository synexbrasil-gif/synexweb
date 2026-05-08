import { NextResponse } from "next/server"

import { getMercadoPagoIntegration, saveMercadoPagoIntegration } from "@/lib/contracts-db"

type MercadoPagoIntegrationInput = {
  publicKey?: string
  accessToken?: string
  clientId?: string
  clientSecret?: string
}

function getDatabaseErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "Nao foi possivel conectar ao banco de dados."
}

export async function GET() {
  try {
    const integration = await getMercadoPagoIntegration()
    return NextResponse.json({ integration })
  } catch (error) {
    return NextResponse.json({ error: getDatabaseErrorMessage(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const input = (await request.json()) as MercadoPagoIntegrationInput

  const publicKey = input.publicKey?.trim()
  const accessToken = input.accessToken?.trim()
  const clientId = input.clientId?.trim()
  const clientSecret = input.clientSecret?.trim()

  if (!publicKey || !accessToken || !clientId || !clientSecret) {
    return NextResponse.json({ error: "Preencha todos os dados do Mercado Pago." }, { status: 400 })
  }

  try {
    const integration = await saveMercadoPagoIntegration({
      publicKey,
      accessToken,
      clientId,
      clientSecret,
    })

    return NextResponse.json({ integration })
  } catch (error) {
    return NextResponse.json({ error: getDatabaseErrorMessage(error) }, { status: 500 })
  }
}
