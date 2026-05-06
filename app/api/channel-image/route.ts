import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get("url")

  if (!imageUrl) {
    return NextResponse.json({ error: "Imagem nao informada." }, { status: 400 })
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(imageUrl)
  } catch {
    return NextResponse.json({ error: "Imagem invalida." }, { status: 400 })
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return NextResponse.json({ error: "Imagem invalida." }, { status: 400 })
  }

  try {
    const response = await fetch(parsedUrl.toString(), {
      cache: "force-cache",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    })

    if (!response.ok || !response.body) {
      return NextResponse.json({ error: "Imagem indisponivel." }, { status: 404 })
    }

    return new NextResponse(response.body, {
      headers: {
        "Cache-Control": "public, max-age=86400",
        "Content-Type": response.headers.get("content-type") ?? "image/png",
      },
    })
  } catch {
    return NextResponse.json({ error: "Imagem indisponivel." }, { status: 404 })
  }
}
