import { NextResponse } from "next/server"

import { findSubscriberByCredentials } from "@/lib/contracts-db"

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
    const contract = await findSubscriberByCredentials(username, password)

    return NextResponse.json({ fullName: contract?.fullName ?? null })
  } catch {
    return NextResponse.json({ fullName: null })
  }
}
