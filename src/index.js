import { env } from "cloudflare:workers";

const FILE_MAP = env.FILE_MAP

// difficulty 数字到字段名的映射
const DIFFICULTY_MAP = {
  '1': 'easy',
  '2': 'normal',
  '3': 'hard',
  '4': 'oni',
  '5': 'ura'
}

// 处理 /api/preview/{id} 路由 - 返回指定 ID 的预览数据
async function handlePreviewById(id) {
  try {
    // 从 /api/previews 获取完整的预览数据库
    const previewsUrl = FILE_MAP['/api/previews']
    if (!previewsUrl) {
      return new Response("Previews database not configured", { status: 500 })
    }

    const response = await fetch(previewsUrl, {
      cf: {
        cacheEverything: true,
        cacheTtl: 3600, // 缓存1小时
      },
    })

    if (!response.ok) {
      return new Response("Failed to fetch previews database", { status: 500 })
    }

    const previewsJson = await response.json()
    
    // 从 JSON 中获取指定 ID 的数据
    const previewData = previewsJson[id]
    
    if (!previewData) {
      return new Response(`Preview data for ID ${id} not found`, { status: 404 })
    }

    // 返回 JSON 响应
    const headers = new Headers()
    applyCors(headers)
    headers.set("Content-Type", "application/json")
    headers.set("Cache-Control", "public, max-age=3600")

    return new Response(JSON.stringify(previewData), {
      status: 200,
      headers,
    })
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 })
  }
}

// 处理 /api/preview/{id}/{filename} 路由 - 从 GitHub 获取图片
async function handlePreviewImage(id, filename) {
  try {
    // 构建 GitHub raw URL
    const imageUrl = `https://raw.githubusercontent.com/KirisameVanilla/chart-preview-database/refs/heads/main/charts/${id}/${filename}`
    
    // 获取图片并缓存
    const upstream = await fetch(imageUrl, {
      cf: {
        cacheEverything: true,
        cacheTtl: 3600, // 缓存1小时
      },
    })

    if (!upstream.ok) {
      return new Response(`Image not found: ${id}/${filename}`, { status: 404 })
    }

    // 复制响应头并注入 CORS
    const headers = new Headers(upstream.headers)
    applyCors(headers)
    headers.set("Cache-Control", "public, max-age=3600")

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    })
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 })
  }
}

// 处理 FILE_MAP 映射路由
async function handleFileMap(pathname) {
  const targetUrl = FILE_MAP[pathname]
  if (!targetUrl) {
    return new Response("Not Found", { status: 404 })
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
}

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const pathname = url.pathname

    // 处理 CORS 预检请求
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      })
    }

    // 检查是否是 /api/preview/{id}/{filename} 路由（需要在 /api/preview/{id} 之前检查）
    const previewImageMatch = pathname.match(/^\/api\/preview\/([^\/]+)\/([^\/]+)\/?$/)
    if (previewImageMatch) {
      const [, id, filename] = previewImageMatch
      return await handlePreviewImage(id, filename)
    }

    // 检查是否是 /api/preview/{id} 路由
    const previewByIdMatch = pathname.match(/^\/api\/preview\/([^\/]+)\/?$/)
    if (previewByIdMatch) {
      const [, id] = previewByIdMatch
      return await handlePreviewById(id)
    }

    return await handleFileMap(pathname)
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
