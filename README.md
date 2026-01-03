# GitHub Raw CDN Worker

将固定的 `/api/*` 路径映射到 GitHub 仓库中的具体 raw 文件，
并通过 Cloudflare Worker 提供 CDN 缓存和 CORS 支持。

## 示例

/api/a → fileA.json  
/api/b → fileB.txt

## 部署

```bash
npm install
wrangler login
npm run deploy
---
