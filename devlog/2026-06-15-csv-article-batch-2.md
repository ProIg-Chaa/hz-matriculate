# 2026-06-15 CSV Article Batch 2

## Summary

本次将新的 CSV 投稿批次转换为正式文章内容，并推送到 `main`。转换后新增 4 篇文章，原始 CSV 从 `article/csv/` 移入 `article/csv/archived/`，保持已处理表单与待处理表单分离。

## Changes

- 新增 4 篇由 CSV 转换生成的文章：
  - `hz20260615015-major-review-gaokao.md`
  - `hz20260615016-university-life-university-life.md`
  - `hz20260615017-application-major-review.md`
  - `hz20260615018-major-review.md`
- 将 `article/csv/6-15.csv` 归档为 `article/csv/archived/6-15-2.csv`。
- 修正一篇文章 frontmatter 中 `display.featured` 的拼写错误，确保它是布尔值而不是字符串。

## Verification

- 发现初次构建失败，原因是 `display.featured: ture` 不符合 Article schema。
- 修正后重新运行构建，确认 Astro 内容校验、静态页面生成和 Pagefind 索引流程通过。

## Notes

- 这批内容来自表单导出的 CSV，发布前仍应人工检查标题、摘要、标签和匿名展示设置。
- 后续批量转换时需要特别留意 frontmatter 中布尔值字段，避免手动修改时输入拼写错误。
