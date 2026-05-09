import { NextResponse } from "next/server"

import {
  findContractByPaymentId,
  findSubscriberByCredentials,
  findSubscriberByLoginCredentials,
  updateContractCredentials,
} from "@/lib/contracts-db"

function getDatabaseErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return "Nao foi possivel alterar as credenciais."
}

export async function PATCH(request: Request) {
  const input = (await request.json()) as {
    currentUsername?: string
    currentPassword?: string
    paymentId?: string
    username?: string
    password?: string
  }

  const currentUsername = input.currentUsername?.trim()
  const currentPassword = input.currentPassword?.trim()
  const paymentId = input.paymentId?.trim()
  const username = input.username?.trim()
  const password = input.password?.trim()

  if ((!currentUsername || !currentPassword) && !paymentId) {
    return NextResponse.json({ error: "Sessao nao encontrada." }, { status: 401 })
  }

  if (!username || !password) {
    return NextResponse.json({ error: "Informe usuario e senha." }, { status: 400 })
  }

  try {
    const contract = paymentId
      ? await findContractByPaymentId(paymentId)
      : (await findSubscriberByLoginCredentials(currentUsername ?? "", currentPassword ?? "")) ??
        (await findSubscriberByCredentials(currentUsername ?? "", currentPassword ?? ""))

    if (!contract) {
      return NextResponse.json({ error: "Contrato nao encontrado." }, { status: 404 })
    }

    const updatedContract = await updateContractCredentials(contract.id, {
      loginUsername: username,
      loginPassword: password,
    })

    return NextResponse.json({
      contract: {
        id: updatedContract?.id,
        iptvPassword: updatedContract?.password,
        iptvUsername: updatedContract?.username,
        loginUsername: updatedContract?.loginUsername,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: getDatabaseErrorMessage(error) }, { status: 500 })
  }
}
