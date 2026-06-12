# 2026-06-12 投稿文章自动格式化流水线

## 背景

本次迭代建立一个最小的文章格式化流水线，用于把 `article/source/` 中的原始投稿批量整理为网站可审核的 Markdown 草稿。目标是降低后续接收投稿后的手工排版成本，同时避免未经审核的内容直接进入正式发布目录。

## 改动范围

- 新增 `scripts/format-articles.mjs`。
- 新增 `npm run format:articles` 命令。
- 建立目录约定：
  - `article/source/` 存放原始投稿。
  - `article/formatted/` 存放自动格式化后的待审核稿。
  - `src/content/articles/` 仍然只存放审核后正式发布的文章。
- README 补充文章格式化工作流。

## 实现取舍

- 脚本使用 Node.js 标准库实现，不引入额外依赖。
- 原文可以没有 frontmatter；缺失时脚本通过关键词启发式生成标题、摘要、分类、标签和匿名作者信息。
- 生成稿统一标记为 `review.status: "editing"`，避免被误认为已经审核完成。
- 脚本只清理空白和整理 Markdown 段落，不进行 AI 改写，不改变作者语气。
- 默认不覆盖已有 formatted 文件；需要重新生成时使用 `npm run format:articles -- --force`。

## 验证

- 已运行 `npm run format:articles`，当前两篇 source 原稿成功生成 formatted 文件。
- 已重复运行 `npm run format:articles`，确认默认跳过已有输出。
- 已运行 `npm run format:articles -- --force`，确认可以覆盖重新生成。
- 已临时复制 formatted 文件到 `src/content/articles/` 并运行 `npm run build`，确认 schema、sitemap 和 Pagefind 构建通过；随后移除临时正式文章。
- 已再次运行 `npm run build`，确认当前正式内容集构建为 16 页。
- 已运行 `npm audit`，结果为 0 个漏洞。
