# 2026-06-11 一轮缺陷修复与功能补齐

## 完成内容

### 1. fix: 修复匿名作者的显示逻辑

- 问题：`author.anonymous ? author.name : author.name` 无论匿名与否都显示 `author.name`，`anonymous` 字段完全未生效。
- 修复：匿名时统一显示"匿名校友"，非匿名时显示真实姓名。
- 同时消除重复代码，提取 `getAuthorLabel()` 和 `getSchoolMajor()` 到 `src/lib/articles.ts`。
- 涉及文件：
  - `src/lib/articles.ts` — 新增两个工具函数
  - `src/components/ArticleCard.astro` — 改用工具函数
  - `src/pages/articles/[slug].astro` — 改用工具函数

### 2. feat: 分类卡片加链接 + 实现分类页

- 给 `src/data/categories.ts` 中每个分类新增 `slug` 字段（gaokao / application / majors / university-life / pathways / announcements），新增 `getCategoryBySlug()` 函数和 `CategorySlug` 类型。
- 新建 `src/pages/categories/[category].astro` 动态路由页，按分类过滤文章展示，空分类显示提示。
- 首页分类卡片从 `<article>` 改为 `<a>` 链接，指向 `/categories/{slug}/`。
- 新增 `a.card` 样式，悬停有边框高亮和微阴影反馈。
- 涉及文件：
  - `src/data/categories.ts`
  - `src/pages/categories/[category].astro`（新文件）
  - `src/pages/index.astro`
  - `src/styles/global.css`

### 3. feat: 接入 sitemap + Open Graph 标签

- 安装 `@astrojs/sitemap`，在 `astro.config.mjs` 中集成。
- 构建时自动生成 `sitemap-index.xml` 和 `sitemap-0.xml`。
- 在 `src/layouts/BaseLayout.astro` 添加 5 个 OG 标签（og:title / og:description / og:type / og:url / og:site_name）+ twitter:card。
- 支持 `ogType` prop，文章详情页设为 `"article"`，其余默认 `"website"`。
- 涉及文件：
  - `package.json` — 新增依赖
  - `astro.config.mjs`
  - `src/layouts/BaseLayout.astro`
  - `src/pages/articles/[slug].astro`

### 4. feat: 接入 Pagefind 静态搜索

- 安装 `pagefind`，build 脚本改为 `astro build && pagefind --site dist`，构建后自动索引。
- 重写 `src/pages/search.astro`：搜索输入框 + 结果列表，通过 PagefindUI JS 驱动。
- 开发环境（无索引）显示友好提示引导执行 build + preview。
- 新增 Pagefind UI 样式到 `src/styles/global.css`，与站点设计风格统一。
- 涉及文件：
  - `package.json`
  - `src/pages/search.astro`
  - `src/styles/global.css`

### 5. refactor: 提取作者信息卡组件

- 新建 `src/components/ArticleInfo.astro`，封装作者信息和适合读者两个 info-item。
- `src/pages/articles/[slug].astro` 中删除 10 行内联 `<section class="info-panel">` 代码，替换为 `<ArticleInfo>` 组件。
- 组件内部自动处理学校/专业拼接、作者匿名判断、受众列表格式化。
- 涉及文件：
  - `src/components/ArticleInfo.astro`（新文件）
  - `src/pages/articles/[slug].astro`
