# 2026-06-11 绑定 jihuway.org 域名

## 背景

项目准备从旧域名 `hz.startyi.com` 切换到新购买的域名 `jihuway.org`。本次先更新仓库内与 GitHub Pages / Astro 构建相关的域名配置。

## 完成内容

- 将 `astro.config.mjs` 的 `site` 改为 `https://jihuway.org`。
- 将根目录 `CNAME` 改为 `jihuway.org`。
- 将 `public/CNAME` 改为 `jihuway.org`，确保 Astro 构建后 `dist/CNAME` 正确生成。

## 重要取舍

- 保留根目录 `CNAME` 和 `public/CNAME` 两份文件：根目录用于仓库可见性，`public/CNAME` 用于构建产物。
- GitHub Actions 部署方式不变。
- DNS 与 GitHub Pages Settings 需要在网页端单独配置，仓库文件无法替代这一步。

## 验证记录

- `npm run build` 通过，Astro、sitemap、Pagefind 均成功构建。
- `npm audit` 通过，结果为 0 vulnerabilities。
- 构建后 `dist/CNAME` 内容为 `jihuway.org`。
- 构建后 `dist/sitemap-index.xml` 指向 `https://jihuway.org/sitemap-0.xml`。

## 后续操作

- 在 GitHub 仓库 `Settings -> Pages` 中将 Custom domain 设置为 `jihuway.org`。
- 在域名服务商处配置 GitHub Pages 所需 DNS 记录。
- 等 GitHub 完成 DNS 检查与 HTTPS 证书签发后，再访问 `https://jihuway.org` 验证。
