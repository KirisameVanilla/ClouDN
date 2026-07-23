# ClouDN

将固定的 `/api/*` 路径映射到 GitHub 仓库中的具体 raw 文件，
并通过 Cloudflare Worker 提供 CDN 缓存和 CORS 支持。

## API

- [/api/cnsongs](https://cdn.ourtaiko.org/api/cnsongs)
- [/api/fumendb_constants](https://cdn.ourtaiko.org/api/fumendb_constants)
- [/api/constants](https://cdn.ourtaiko.org/api/constants)
- [/api/previews](https://cdn.ourtaiko.org/api/previews)
- [/api/preview/\${id}](https://cdn.ourtaiko.org/api/preview/495)
- [/api/preview/\${id}/\${filename}](https://cdn.ourtaiko.org/api/preview/495/4.jpg)

## 部署

```bash
npm install
wrangler login
npm run deploy
---
