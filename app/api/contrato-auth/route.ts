import { NextResponse } from "next/server"

import { authenticateAdminUser } from "@/lib/contracts-db"

const CONTRACT_USERNAME = "synexbr"
const CONTRACT_PASSWORD = "synex2026"
const CONTRACT_AUTH_COOKIE = "synex_contract_auth"
const CONTRACT_AUTH_VALUE = "authorized"
const ADMIN_NAME_COOKIE = "synex_admin_name"
const ADMIN_ROLE_COOKIE = "synex_admin_role"

function parseCookie(request: Request, name: string) {
  const cookie = request.headers.get("cookie") ?? ""
  const item = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))

  return item ? decodeURIComponent(item.slice(name.length + 1)) : ""
}

function isAuthenticated(request: Request) {
  const cookie = request.headers.get("cookie") ?? ""
  return cookie
    .split(";")
    .map((part) => part.trim())
    .includes(`${CONTRACT_AUTH_COOKIE}=${CONTRACT_AUTH_VALUE}`)
}

export async function GET(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 })
  }

  return NextResponse.json({
    admin: {
      fullName: parseCookie(request, ADMIN_NAME_COOKIE) || "Synex Brasil",
      role: parseCookie(request, ADMIN_ROLE_COOKIE) || "Admin",
    },
  })
}

export async function POST(request: Request) {
  const credentials = (await request.json()) as {
    username?: string
    password?: string
    rememberSession?: boolean
  }

  const username = credentials.username?.trim() ?? ""
  const password = credentials.password ?? ""
  const rememberSession = credentials.rememberSession === true
  const isDefaultAdmin = username === CONTRACT_USERNAME && password === CONTRACT_PASSWORD
  const adminUser = isDefaultAdmin ? null : await authenticateAdminUser(username, password).catch(() => null)

  if (!isDefaultAdmin && !adminUser) {
    return NextResponse.json({ error: "Usuario ou senha invalidos." }, { status: 401 })
  }

  const response = NextResponse.json({
    ok: true,
    admin: {
      fullName: adminUser?.fullName ?? "Synex Brasil",
      role: adminUser?.role ?? "Admin",
    },
  })
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    ...(rememberSession ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  }

  response.cookies.set(CONTRACT_AUTH_COOKIE, CONTRACT_AUTH_VALUE, {
    ...cookieOptions,
  })
  response.cookies.set(ADMIN_NAME_COOKIE, adminUser?.fullName ?? "Synex Brasil", {
    ...cookieOptions,
  })
  response.cookies.set(ADMIN_ROLE_COOKIE, adminUser?.role ?? "Admin", {
    ...cookieOptions,
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
  response.cookies.set(ADMIN_NAME_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
  response.cookies.set(ADMIN_ROLE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })

  return response
}
