# 2026-06-12 首批真实文章发布准备

## 背景

本次在文章格式化流水线基础上，加入首批真实投稿内容。原始稿放入 `article/source/`，格式化稿保留在 `article/formatted/`，并将审核后的版本复制到 `src/content/articles/` 作为正式网站内容参与构建。

## 改动范围

- 新增第 3、4 篇原始投稿与格式化稿。
- 将第 1-4 篇文章加入 `src/content/articles/`。
- 调整部分 formatted/正式文章的作者显示信息，使用 `anonymous: false` 时展示真实署名。

## 取舍说明

- 正式文章仍保留 `review.status: "editing"`，表示内容可先进入网站验证，但后续仍可继续校对标题、标签和措辞。
- `article/formatted/` 继续作为待审稿留存；实际展示以 `src/content/articles/` 为准。
- 本次不改内容 schema，不改页面结构，不新增自动发布逻辑。

## 验证

- 已运行 `npm run build`，4 篇正式文章均通过 Astro schema、sitemap 和 Pagefind 构建；本次构建输出 20 个页面。
- 已运行 `npm audit`，结果为 0 个漏洞。
