# 2026-06-23 CSV Approved Articles

## Summary

本次从最新 `main` 拉取仓库后，基于 `article/csv/6-23.csv` 转换审核情况为“拟通过”的投稿文章，并放入正式文章内容目录。

## Changes

- 使用 `npm run csv:convert -- article/csv/6-23.csv` 处理 CSV。
- 共识别 25 行记录，其中 10 行为“拟通过”，15 行被跳过。
- 新增 9 篇文章，并更新 1 篇已有文章：
  - `hz-20260621-037-major-review.md`
  - `hz-20260621-038-question-answer-major-review.md`
  - `hz-20260621-039-major-review-major-review.md`
  - `hz-20260621-040-question-answer.md`
  - `hz-20260622-041-major-review.md`
  - `hz-20260622-042-question-answer-volunteer-application.md`
  - `hz-20260622-043-question-answer.md`
  - `hz-20260623-044-question-answer-volunteer-application.md`
  - `hz-20260623-045-university-life-university-life.md`
  - `hz-20260623-046-application.md`
- 将原始 CSV 归档到 `article/csv/archived/6-23.csv`。

## Verification

- 先运行 dry-run，确认只会写入“拟通过”文章。
- 正式转换后运行 `npm run build`，确认 Astro 内容校验、静态页面生成和 Pagefind 索引通过。

## Notes

- 转换过程中有 1 篇“问题回答”未匹配到现有问题标题：`抗压能力弱 平时也会出现情绪低落问题怎么调节？到什么程度需要寻求专业帮助`。脚本已按当前规则跳过 `question` 字段，后续可以补建对应问题页后再关联。
- 其余非“拟通过”记录包括“已上传”和“退回”，本次没有发布。
