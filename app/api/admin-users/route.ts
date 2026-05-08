import { NextResponse } from "next/server"

import { createAdminUser, deleteAdminUser, listAdminUsers, type AdminUser } from "@/lib/contracts-db"

const CONTRACT_AUTH_COOKIE = "synex_contract_auth"
const CONTRACT_AUTH_VALUE = "authorized"
const ADMIN_ROLE_COOKIE = "synex_admin_role"

type AdminUserInput = Omit<AdminUser, "id" | "createdAt">

function isAuthenticated(request: Request) {
  const cookie = request.headers.get("cookie") ?? ""
  return cookie
    .split(";")
    .map((part) => part.trim())
    .includes(`${CONTRACT_AUTH_COOKIE}=${CONTRACT_AUTH_VALUE}`)
}

function parseCookie(request: Request, name: string) {
  const cookie = request.headers.get("cookie") ?? ""
  const item = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))

  return item ? decodeURIComponent(item.slice(name.length + 1)) : ""
}

function canManageAdminUsers(request: Request) {
  const role = parseCookie(request, ADMIN_ROLE_COOKIE) || "Admin"
  return ["admin", "ceo"].includes(role.trim().toLowerCase())
}

function getDatabaseErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "Nao foi possivel conectar ao banco de dados."
}

export async function GET(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 })
  }
  if (!canManageAdminUsers(request)) {
    return NextResponse.json({ error: "Acesso restrito." }, { status: 403 })
  }

  try {
    const users = await listAdminUsers()
    return NextResponse.json({ users })
  } catch (error) {
    return NextResponse.json({ error: getDatabaseErrorMessage(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 })
  }
  if (!canManageAdminUsers(request)) {
    return NextResponse.json({ error: "Acesso restrito." }, { status: 403 })
  }

  const input = (await request.json()) as Partial<AdminUserInput>

  const fullName = input.fullName?.trim()
  const username = input.username?.trim()
  const password = input.password?.trim()
  const role = input.role?.trim()

  if (!fullName || !username || !password || !role) {
    return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 })
  }

  try {
    const user = await createAdminUser({
      fullName,
      username,
      password,
      role,
    })

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: getDatabaseErrorMessage(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 })
  }
  if (!canManageAdminUsers(request)) {
    return NextResponse.json({ error: "Acesso restrito." }, { status: 403 })
  }

  const userId = new URL(request.url).searchParams.get("id")

  if (!userId) {
    return NextResponse.json({ error: "Usuario nao informado." }, { status: 400 })
  }

  try {
    const users = await deleteAdminUser(userId)
    return NextResponse.json({ users })
  } catch (error) {
    return NextResponse.json({ error: getDatabaseErrorMessage(error) }, { status: 500 })
  }
}
