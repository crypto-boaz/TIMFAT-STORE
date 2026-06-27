import type { NextRequest } from "next/server";

const BACKEND_API_URL = (process.env.BACKEND_API_URL ?? "https://paytrack-t2tp.onrender.com/api").replace(/\/+$/, "");

async function proxyRequest(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const sourceUrl = new URL(request.url);
  const upstreamUrl = `${BACKEND_API_URL}/${path.map(encodeURIComponent).join("/")}${sourceUrl.search}`;
  const headers = new Headers();

  for (const name of ["accept", "authorization", "content-type"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const response = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual"
    });

    const responseHeaders = new Headers();
    const contentType = response.headers.get("content-type");
    if (contentType) responseHeaders.set("content-type", contentType);
    responseHeaders.set("cache-control", "no-store");

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });
  } catch {
    return Response.json({ message: "The PayTrack backend is temporarily unavailable." }, { status: 502 });
  }
}

export const dynamic = "force-dynamic";
export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
