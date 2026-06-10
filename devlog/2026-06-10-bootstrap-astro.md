# 2026-06-10 Bootstrap Astro 主干骨架

## 背景

本次迭代目标是按“最小化、最可拓展化”的原则完成项目主干部分：先建立稳定静态站骨架和内容模型，不提前引入数据库、登录、后台、复杂筛选或动态推荐。

## 完成内容

- 从 `main` 创建 `feature/bootstrap-astro` 分支。
- 初始化 Astro 静态站工程，新增基础 npm scripts：
  - `npm run dev`
  - `npm run build`
  - `npm run preview`
- 建立 Content Collections 内容模型：
  - 文章目录：`src/content/articles/`
  - schema：`src/content.config.ts`
  - 固定字段：`title`、`description`、`date`、`updated`、`category`、`tags`、`author`、`audience`、`review`、`display`
- 完成第一批稳定页面：
  - `/`
  - `/articles/`
  - `/articles/[slug]/`
  - `/submit/`
  - `/about/`
  - `/disclaimer/`
  - `/search/`
  - `/404`
- 添加 3 篇明确标注为示例的文章，用于验证列表、详情页和 frontmatter schema。
- 新增原生 CSS 响应式布局，不引入 UI 框架。
- 新增 `.env.example`，预留：
  - `PUBLIC_SITE_NAME`
  - `PUBLIC_SITE_DESCRIPTION`
  - `PUBLIC_SUBMISSION_FORM_URL`
- 更新 `.gitignore`，忽略依赖、构建产物、本地环境变量和 Playwright CLI 快照。
- 更新 `README.md`，说明本地开发、环境变量、内容维护和当前项目边界。

## 重要取舍

- 搜索页只保留占位入口，后续再单独接入 Pagefind。
- 分类和标签只作为内容字段与展示 chip 使用，暂不实现动态分类页和标签页。
- 投稿表单真实链接尚未确定，先通过环境变量预留。
- 移除了 `@astrojs/check`，避免开发期 YAML language server 审计噪声；当前主干以 `npm run build` 作为基础验收命令。

## 验证记录

- `npm run build` 通过，生成 10 个静态页面。
- `npm audit` 通过，结果为 0 vulnerabilities。
- 本地关键路由 HTTP 检查均返回 200：
  - `/`
  - `/articles/`
  - `/articles/example-major-review/`
  - `/submit/`
  - `/about/`
  - `/disclaimer/`
  - `/search/`
- 使用 Playwright CLI 检查桌面与移动端页面：
  - 桌面首页无横向溢出。
  - 移动端文章详情页无横向溢出。
  - 文章免责声明正常展示。
- 修正了 Markdown 日期因时区偏移导致 `2026-06-10` 显示为 `2026/06/09` 的问题，日期格式化固定使用 UTC。

## 后续建议

- 补充真实校友文章后，替换或移除示例文章。
- 投稿表单确定后，配置 `PUBLIC_SUBMISSION_FORM_URL`。
- 内容数量增长后，再接入 Pagefind 搜索。
- 分类和标签内容稳定后，再实现 `/categories/[category]` 与 `/tags/[tag]`。
