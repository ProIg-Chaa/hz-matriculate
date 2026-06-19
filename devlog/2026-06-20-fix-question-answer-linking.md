# 修复问题-答案关联

## 问题

CSV 脚本的 `关联问题` 列填写的是问题中文标题，但 `getAnswersForQuestion()` 按问题 slug（文件名）匹配，导致所有问题都显示 0 个回答。

## 方案

### CSV 脚本：标题→slug 映射

新增 `buildQuestionTitleToSlugMap()`，读取 `src/content/questions/` 下所有问题 MD 文件，从 frontmatter 提取 `title`，建立标题到 slug 的映射。转换时自动将 `关联问题` 的中文标题解析为 slug，同时强制分类为 `问题回答`。

### questions.ts：标题兜底匹配

`getAnswersForQuestion()` 增加标题匹配：slug 或 title 任一命中即视为关联。

## 涉及文件

| 文件 | 说明 |
|------|------|
| `scripts/csv-to-md.mjs` | 新增 `buildQuestionTitleToSlugMap()`；`buildArticle()` 标题→slug 解析 + 分类强制覆盖 |
| `src/lib/questions.ts` | `getAnswersForQuestion()` 增加标题兜底匹配 |
