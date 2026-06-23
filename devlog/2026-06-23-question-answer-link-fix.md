# 2026-06-23 Question Answer Link Fix

## Summary

本次补齐 `6-23.csv` 批次中一篇问题回答的关联关系。该回答对应的问题已经存在于 questions collection，但转换时没有匹配成功，因此文章没有出现在问题详情页的回答列表中。

## Changes

- 将 `src/content/articles/hz-20260622-041-major-review.md` 的分类改为 `问题回答`。
- 添加 `question: "Q-20260620-002"`，关联到“抗压能力弱 平时也会出现情绪低落问题怎么调节？到什么程度需要寻求专业帮助？”。
- 按“全匿名”要求，将该回答作者展示改为匿名校友，并关闭联系方式展示。
- 保留本轮手动添加的精选展示调整，用于让对应文章进入首页精选。

## Verification

- 运行 `npm run build`，确认内容 schema、问题页聚合和 Pagefind 索引通过。

## Notes

- `Q-20260620-002.md` 已经存在，且问题提问者为匿名，因此本次没有新增问题文件。
