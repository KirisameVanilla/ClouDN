import { env } from "cloudflare:workers";

const FILE_MAP = env.FILE_MAP

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const pathname = url.pathname

    const targetUrl = FILE_MAP[pathname]
    if (!targetUrl) {
      return new Response("Not Found", { status: 404 })
    }

    // 处理 CORS 预检请求
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      })
    }

    // 向 GitHub Raw 拉取文件
    const upstream = await fetch(targetUrl, {
      cf: {
        cacheEverything: true,
        cacheTtl: 3600, // 1 小时 CDN 缓存
      },
    })

    if (!upstream.ok) {
      return new Response("Upstream Not Found", { status: 404 })
    }

    // 复制响应头并注入 CORS
    const headers = new Headers(upstream.headers)
    applyCors(headers)

    // 强制 CDN 可缓存
    headers.set("Cache-Control", "public, max-age=3600")

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    })
  },
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400",
  }
}

function applyCors(headers) {
  headers.set("Access-Control-Allow-Origin", "*")
  headers.set("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS")
  headers.set("Access-Control-Allow-Headers", "*")
}
