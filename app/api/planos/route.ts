import { NextResponse } from "next/server"

import { listPlans, updatePlans } from "@/lib/contracts-db"

const CONTRACT_AUTH_COOKIE = "synex_contract_auth"
const CONTRACT_AUTH_VALUE = "authorized"

type PlanInput = {
  id?: string
  price?: number | string
}

function getDatabaseErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("Configure MYSQL_URL")) {
    return error.message
  }

  return "Nao foi possivel conectar ao banco de dados."
}

export async function GET() {
  try {
    const plans = await listPlans()
    return NextResponse.json({ plans })
  } catch (error) {
    return NextResponse.json({ error: getDatabaseErrorMessage(error) }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const cookie = request.headers.get("cookie") ?? ""
  const isAuthenticated = cookie
    .split(";")
    .map((part) => part.trim())
    .includes(`${CONTRACT_AUTH_COOKIE}=${CONTRACT_AUTH_VALUE}`)

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 })
  }

  const input = (await request.json()) as { plans?: PlanInput[] }
  const plans = Array.isArray(input.plans) ? input.plans : []

  const normalizedPlans = plans.map((plan) => ({
    id: plan.id?.trim() ?? "",
    price: Number(String(plan.price ?? "").replace(/\./g, "").replace(",", ".")),
  }))

  if (normalizedPlans.some((plan) => !plan.id || !Number.isFinite(plan.price) || plan.price <= 0)) {
    return NextResponse.json({ error: "Informe precos validos para os planos." }, { status: 400 })
  }

  try {
    const updatedPlans = await updatePlans(normalizedPlans)
    return NextResponse.json({ plans: updatedPlans })
  } catch (error) {
    return NextResponse.json({ error: getDatabaseErrorMessage(error) }, { status: 500 })
  }
}
