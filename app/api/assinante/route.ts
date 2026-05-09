import { NextResponse } from "next/server"

import { findSubscriberByCredentials, findSubscriberByLoginCredentials } from "@/lib/contracts-db"

function parseBrazilianDate(value: string | null | undefined) {
  const match = value?.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null

  const [, day, month, year] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))

  if (Number.isNaN(date.getTime())) return null
  return date
}

function getPlanDurationInMonths(plan: string | null | undefined) {
  const normalizedPlan = plan?.trim().toLowerCase() ?? ""

  if (normalizedPlan.includes("mensal")) return 1
  if (normalizedPlan.includes("trimestral")) return 3
  if (normalizedPlan.includes("anual")) return 12

  return null
}

function isContractExpired(activationDate: string | null | undefined, plan: string | null | undefined) {
  const startDate = parseBrazilianDate(activationDate)
  const durationInMonths = getPlanDurationInMonths(plan)

  if (!startDate || !durationInMonths) return false

  const expirationDate = new Date(startDate)
  expirationDate.setMonth(expirationDate.getMonth() + durationInMonths)
  expirationDate.setHours(0, 0, 0, 0)

  return Date.now() >= expirationDate.getTime()
}

export async function POST(request: Request) {
  const credentials = (await request.json()) as {
    username?: string
    password?: string
  }

  const username = credentials.username?.trim()
  const password = credentials.password?.trim()

  if (!username || !password) {
    return NextResponse.json({ fullName: null })
  }

  try {
    const contract =
      (await findSubscriberByLoginCredentials(username, password)) ?? (await findSubscriberByCredentials(username, password))

    return NextResponse.json({
      activationDate: contract?.activationDate ?? null,
      contractId: contract?.id ?? null,
      fullName: contract?.fullName ?? null,
      loginPassword: contract?.loginPassword ?? null,
      loginUsername: contract?.loginUsername ?? null,
      contractUsername: contract?.username ?? null,
      iptvPassword: contract?.password ?? null,
      iptvUsername: contract?.username ?? null,
      isExpired: contract ? isContractExpired(contract.activationDate, contract.plan) : false,
      paymentId: contract?.paymentId ?? null,
      plan: contract?.plan ?? null,
    })
  } catch {
    return NextResponse.json({
      activationDate: null,
      contractId: null,
      fullName: null,
      isExpired: false,
      paymentId: null,
      plan: null,
    })
  }
}
