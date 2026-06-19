# 修复：问题-答案关联

## 问题

CSV 里面的 `关联问题` 全都是无，导致所有问题都显示 0 个回答。

## 方案

### CSV 脚本：标题→slug 映射

新增 `buildQuestionTitleToSlugMap()`，读取 `src/content/questions/` 下所有问题 MD 文件，从 frontmatter 提取 `title`，建立标题到 slug 的映射。转换时自动将 `关联问题` 的中文标题解析为 slug，同时强制分类为 `问题回答`。

**人话：** 
- 脚本根据 csv `关联问题`的参数，寻找问题库。
- 若匹配某问题的中文名，则提取问题对应的md的文件名，写入文章md的question参数中，同时将category设为 `问题回答`。

## 文件改动

| 文件                      | 说明                                                                      |
| ----------------------- | ----------------------------------------------------------------------- |
| `scripts/csv-to-md.mjs` | 新增 `buildQuestionTitleToSlugMap()`；`buildArticle()` 标题→slug 解析 + 分类强制覆盖 |
| `src/lib/questions.ts`  | `getAnswersForQuestion()` 增加标题兜底匹配                                      |
