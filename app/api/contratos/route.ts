import { NextResponse } from "next/server"

import { createContract, deleteContract, listContracts, updateContract, type Contract } from "@/lib/contracts-db"

type ContractInput = Omit<Contract, "id" | "createdAt">

function getDatabaseErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("Configure MYSQL_URL")) {
    return error.message
  }

  return "Nao foi possivel conectar ao banco de dados."
}

export async function GET() {
  try {
    const contracts = await listContracts()
    return NextResponse.json({ contracts })
  } catch (error) {
    return NextResponse.json({ error: getDatabaseErrorMessage(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const contractInput = (await request.json()) as Partial<ContractInput>

  const fullName = contractInput.fullName?.trim()
  const username = contractInput.username?.trim()
  const password = contractInput.password?.trim()
  const activationDate = contractInput.activationDate?.trim()
  const plan = contractInput.plan?.trim()

  if (!fullName || !username || !password || !activationDate || !plan) {
    return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 })
  }

  try {
    const contract = await createContract({
      fullName,
      username,
      password,
      activationDate,
      plan,
    })

    return NextResponse.json({ contract })
  } catch (error) {
    return NextResponse.json({ error: getDatabaseErrorMessage(error) }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const contractInput = (await request.json()) as Partial<ContractInput> & { id?: string }

  const id = contractInput.id?.trim()
  const fullName = contractInput.fullName?.trim()
  const username = contractInput.username?.trim()
  const password = contractInput.password?.trim()
  const activationDate = contractInput.activationDate?.trim()
  const plan = contractInput.plan?.trim()

  if (!id) {
    return NextResponse.json({ error: "Contrato nao informado." }, { status: 400 })
  }

  if (!fullName || !username || !password || !activationDate || !plan) {
    return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 })
  }

  try {
    const contract = await updateContract(id, {
      fullName,
      username,
      password,
      activationDate,
      plan,
    })

    if (!contract) {
      return NextResponse.json({ error: "Contrato nao encontrado." }, { status: 404 })
    }

    return NextResponse.json({ contract })
  } catch (error) {
    return NextResponse.json({ error: getDatabaseErrorMessage(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const contractId = new URL(request.url).searchParams.get("id")

  if (!contractId) {
    return NextResponse.json({ error: "Contrato nao informado." }, { status: 400 })
  }

  try {
    const contracts = await deleteContract(contractId)
    return NextResponse.json({ contracts })
  } catch (error) {
    return NextResponse.json({ error: getDatabaseErrorMessage(error) }, { status: 500 })
  }
}
