import { NextRequest, NextResponse } from "next/server"

const CONTRACT_AUTH_COOKIE = "synex_contract_auth"
const CONTRACT_AUTH_VALUE = "authorized"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthenticated = request.cookies.get(CONTRACT_AUTH_COOKIE)?.value === CONTRACT_AUTH_VALUE

  if (pathname.startsWith("/api/contratos")) {
    if (isAuthenticated) return NextResponse.next()

    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 })
  }

  if (pathname === "/contrato/login") return NextResponse.next()

  if (isAuthenticated) return NextResponse.next()

  const loginUrl = new URL("/contrato/login", request.url)
  loginUrl.searchParams.set("next", pathname)

  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/contrato/:path*", "/contratos/:path*", "/api/contratos/:path*"],
}
