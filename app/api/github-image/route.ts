import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  const token = process.env.GITHUB_TOKEN

  if (!url) {
    return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
      redirect: "follow",
    })

    if (!response.ok) {
      return NextResponse.json({ error: "GitHub Image Fetch Failed" }, { status: response.status })
    }

    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get("Content-Type") || "image/png"

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, immutable",
      },
    })
  } catch (error) {
    console.error("GitHub Image Proxy Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
