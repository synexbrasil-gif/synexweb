import { NextResponse } from "next/server"

import { findSubscriberByCredentials, findSubscriberByLoginCredentials } from "@/lib/contracts-db"

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
      paymentId: contract?.paymentId ?? null,
      plan: contract?.plan ?? null,
    })
  } catch {
    return NextResponse.json({
      activationDate: null,
      contractId: null,
      fullName: null,
      paymentId: null,
      plan: null,
    })
  }
}
