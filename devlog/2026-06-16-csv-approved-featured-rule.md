# 2026-06-16 CSV Approved Featured Rule

## Summary

本次调整 CSV 转换规则：脚本只发布审核情况为“拟通过”的文章，并读取 CSV 中“是否精选”列来设置 `display.featured`。随后使用 `article/csv/6-16.csv` 生成本批可发布文章。

## Changes

- `scripts/csv-to-md.mjs`
  - 处理范围从“待审核”改为“拟通过”。
  - `review.status` 对“拟通过”映射为 `published`。
  - 新增读取“是否精选”列，值为“是”时生成 `display.featured: true`，否则为 `false`。
- CSV 内容转换
  - 使用 `article/csv/6-16.csv` 执行转换。
  - 跳过 7 条“已上传”记录。
  - 新增 1 篇文章：`src/content/articles/hz20260615019-application-volunteer-application.md`。
  - 将原 CSV 归档到 `article/csv/archived/6-16.csv`。

## Verification

- 先运行 dry-run，确认只会写入 1 篇“拟通过”文章。
- 正式转换后检查新文章 frontmatter，确认 `review.status: "published"`，`display.featured` 来自“是否精选”列。
- 运行 `npm run build` 验证 Astro 内容集合、静态页面和 Pagefind 索引。

## Notes

- 从现在开始，CSV 表格中的“拟通过”代表可以进入网站发布目录。
- “是否精选”成为首页精选控制入口，避免转换后再手动改 Markdown。
