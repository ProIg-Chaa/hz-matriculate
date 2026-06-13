# 文章点赞 API 配置与排查

本文记录文章点赞功能的完整配置流程。点赞功能由静态站前端、Cloudflare Worker 和 Cloudflare KV 组成。

## 架构

```text
jihuway.org 文章详情页
  -> PUBLIC_LIKE_API_URL
  -> Cloudflare Worker
  -> Cloudflare KV
```

当前前端组件位于：

```text
src/components/LikeButton.astro
```

Worker 示例代码位于：

```text
workers/likes-worker.mjs
```

## Cloudflare Worker

在 Cloudflare 创建 Worker 后，将 `workers/likes-worker.mjs` 的内容部署为 Worker 代码。

Worker 提供两个接口：

```text
GET  /likes/:slug   读取文章点赞数
POST /likes/:slug   给文章点赞并返回最新点赞数
```

其中 `slug` 是文章 URL 中的文章标识。例如：

```text
/articles/5-application-volunteer-application/
```

对应 API key：

```text
article:5-application-volunteer-application
```

## KV 绑定

在 Cloudflare 创建 KV namespace 后，需要将它绑定到 Worker。

绑定名必须是：

```text
LIKES
```

Worker 代码通过 `env.LIKES` 访问 KV。绑定名写错会导致 API 返回错误。

KV 中的数据格式很简单：

```text
key:   article:5-application-volunteer-application
value: 16
```

少量手动修正点赞数时，可以直接在 Cloudflare KV 后台修改或删除对应 key。

## 自定义 API 域名

不要让前端长期直接请求 `*.workers.dev`。该域名在部分网络环境下可能访问不稳定。

推荐给 Worker 绑定自定义域名：

```text
https://likes.jihuway.org
```

Cloudflare 操作路径：

```text
Workers & Pages
-> 对应 Worker
-> Settings
-> Domains & Routes
-> Add
-> Custom Domain
```

填入：

```text
likes.jihuway.org
```

绑定后测试：

```bash
curl https://likes.jihuway.org/likes/test-article
curl -X POST https://likes.jihuway.org/likes/test-article
```

正常返回示例：

```json
{"slug":"test-article","likes":1}
```

## CORS 配置

Worker 使用 `ALLOWED_ORIGIN` 控制允许哪些网页来源调用 API。

线上推荐值：

```text
https://jihuway.org
```

如果需要同时支持本地预览，可以使用逗号分隔：

```text
https://jihuway.org,http://127.0.0.1:4322,http://localhost:4322
```

如果临时排查问题，也可以设置为：

```text
*
```

但长期不建议使用 `*`。

注意：`http://jihuway.org` 和 `https://jihuway.org` 在浏览器中是不同 origin。正式站点应统一跳转到 HTTPS。

Cloudflare 建议开启：

```text
SSL/TLS
-> Edge Certificates
-> Always Use HTTPS
```

## GitHub Pages 构建变量

Astro 的 `PUBLIC_` 环境变量是在构建时写入静态 HTML 的。修改 GitHub 变量后，必须重新构建部署网站。

GitHub 仓库中需要添加 Actions Variable：

```text
PUBLIC_LIKE_API_URL=https://likes.jihuway.org
```

路径：

```text
Settings
-> Secrets and variables
-> Actions
-> Variables
```

同时 `.github/workflows/deploy.yml` 的 Build 步骤需要显式传入变量：

```yaml
- name: Build
  run: npm run build
  env:
    PUBLIC_LIKE_API_URL: ${{ vars.PUBLIC_LIKE_API_URL }}
```

如果这一步缺失，线上 HTML 会继续使用旧地址或空地址。

## 验证线上页面是否使用了新 API

打开：

```text
view-source:https://jihuway.org/articles/5-application-volunteer-application/
```

搜索：

```text
data-like-endpoint
```

正确结果应类似：

```html
data-like-endpoint="https://likes.jihuway.org"
```

如果仍然看到：

```html
data-like-endpoint="https://royal-art-8f40.1156364963.workers.dev"
```

说明 GitHub Pages 还没有使用新的 `PUBLIC_LIKE_API_URL` 重新构建。需要确认 GitHub Actions Variable 和 workflow，然后重新运行部署。

## 常见问题

### 1. API 单独能打开，但站内显示读取失败

优先检查：

- 页面源码中的 `data-like-endpoint` 是否仍是旧地址。
- Worker 的 CORS 是否允许当前网站 origin。
- 当前访问的是 `https://jihuway.org` 还是 `http://jihuway.org`。

### 2. 开 VPN 可以，不开 VPN 不可以

如果页面仍请求 `*.workers.dev`，大陆网络可能访问失败。应使用 Worker 自定义域名：

```text
https://likes.jihuway.org
```

然后更新 GitHub Actions Variable，并重新部署。

### 3. 本地可以 curl，但浏览器不行

curl 不受浏览器 CORS 限制。浏览器失败时检查 Worker 响应头：

```bash
curl -i -X OPTIONS "https://likes.jihuway.org/likes/test-article" \
  -H "Origin: http://127.0.0.1:4322" \
  -H "Access-Control-Request-Method: POST"
```

响应中的 `Access-Control-Allow-Origin` 必须匹配当前页面 origin，或者为 `*`。

### 4. 点赞数字短时间不一致

Cloudflare KV 是边缘存储，读取存在 eventual consistency。不同地区节点可能短时间看到不同数字。等待一段时间后通常会同步。

### 5. 手机端读取失败

先确认手机访问的是：

```text
https://jihuway.org
```

如果访问 `http://jihuway.org`，可能会因为 origin 不匹配导致失败。建议开启 Cloudflare 的 Always Use HTTPS。

## 发布检查清单

- Worker 已部署最新 `workers/likes-worker.mjs`。
- Worker 绑定了 KV，绑定名为 `LIKES`。
- Worker 自定义域名 `https://likes.jihuway.org` 可访问。
- Worker `ALLOWED_ORIGIN` 包含 `https://jihuway.org`。
- GitHub Actions Variable `PUBLIC_LIKE_API_URL` 为 `https://likes.jihuway.org`。
- `.github/workflows/deploy.yml` Build 步骤传入了 `PUBLIC_LIKE_API_URL`。
- GitHub Pages 已重新部署。
- 页面源码中的 `data-like-endpoint` 已变为 `https://likes.jihuway.org`。
- Cloudflare 已开启 Always Use HTTPS。
