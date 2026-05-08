import { NextResponse } from "next/server"

import { updateContractLoginByPaymentId } from "@/lib/contracts-db"

function getDatabaseErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return "Nao foi possivel salvar o login."
}

export async function POST(request: Request) {
  const input = (await request.json()) as {
    paymentId?: string
    username?: string
    password?: string
  }

  const paymentId = input.paymentId?.trim()
  const username = input.username?.trim()
  const password = input.password?.trim()

  if (!paymentId) {
    return NextResponse.json({ error: "Pedido nao informado." }, { status: 400 })
  }

  if (!username || !password) {
    return NextResponse.json({ error: "Informe usuario e senha." }, { status: 400 })
  }

  try {
    const contract = await updateContractLoginByPaymentId(paymentId, {
      loginUsername: username,
      loginPassword: password,
    })

    if (!contract) {
      return NextResponse.json({ error: "Pedido nao encontrado." }, { status: 404 })
    }

    return NextResponse.json({
      contract: {
        fullName: contract.fullName,
        id: contract.id,
        loginUsername: contract.loginUsername,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: getDatabaseErrorMessage(error) }, { status: 500 })
  }
}
