# 2026-06-23 Fix Question Answer Slug Case

## Summary

修复问题页无法显示部分已征集回答的问题。CSV 转换出的回答文章使用了 `Q-20260620-xxx` 形式的 question slug，而 Astro 内容集合生成的问题页面 slug 为小写 `q-20260620-xxx`，原来的聚合逻辑大小写敏感，导致这些回答没有被计入问题详情页。

## Changes

- 更新 `src/lib/questions.ts` 的 `getAnswersForQuestion`。
- 对 `question` slug 关联改为大小写不敏感比较。
- 保留标题直连匹配能力，兼容旧内容。

## Verification

- 运行 `npm run build`，确认问题页、文章页和 Pagefind 索引正常构建。

## Notes

- 本次不批量改写已有文章 frontmatter，避免制造不必要的内容变更。
- 后续可考虑让 CSV 脚本输出统一小写 slug，进一步减少歧义。
