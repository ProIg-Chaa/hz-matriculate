# 2026-06-10 GitHub Pages Actions 部署

## 背景

本次迭代目标是改用 GitHub Actions 发布 Astro 静态站。每次 `main` 分支更新后，由 GitHub 自动安装依赖、构建 `dist/`，并发布到 GitHub Pages。

## 完成内容

- 新增 `.github/workflows/deploy.yml`。
- 工作流触发方式：
  - push 到 `main`
  - GitHub 页面手动触发 `workflow_dispatch`
- 工作流步骤：
  - checkout 仓库
  - 使用 Node.js 22
  - 通过 `npm ci` 安装依赖
  - 执行 `npm run build`
  - 上传 `dist/` 作为 Pages artifact
  - 使用 `actions/deploy-pages@v4` 发布到 GitHub Pages
- 新增 `public/CNAME`，确保 Astro 构建后 `dist/CNAME` 存在。

## 重要取舍

- 这次直接在 `main` 分支修改，不走 PR。
- 使用 GitHub Pages 的 `GitHub Actions` source，而不是 `Deploy from a branch`。
- 保留根目录 `CNAME`，同时新增 `public/CNAME`；根目录文件保留仓库可见性，`public/CNAME` 用于构建产物。

## 验证记录

- 本地执行 `npm run build`，确认 Astro 构建通过。
- 构建后确认 `dist/CNAME` 存在，内容为 `hz.startyi.com`。

## 后续操作

- 在 GitHub 仓库 `Settings -> Pages` 中将 Source 设置为 `GitHub Actions`。
- 确认域名 DNS 中 `hz.startyi.com` 的 CNAME 指向 `ProIg-Chaa.github.io`。
