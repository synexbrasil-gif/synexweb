import { NextResponse } from "next/server"

const CONTRACT_USERNAME = "synexbr"
const CONTRACT_PASSWORD = "synex2026"
const CONTRACT_AUTH_COOKIE = "synex_contract_auth"
const CONTRACT_AUTH_VALUE = "authorized"

export async function POST(request: Request) {
  const credentials = (await request.json()) as {
    username?: string
    password?: string
  }

  if (
    credentials.username?.trim() !== CONTRACT_USERNAME ||
    credentials.password !== CONTRACT_PASSWORD
  ) {
    return NextResponse.json({ error: "Usuario ou senha invalidos." }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(CONTRACT_AUTH_COOKIE, CONTRACT_AUTH_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(CONTRACT_AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })

  return response
}
