# CSV → MD 字段映射

## 对照表

| CSV 列  | MD 字段                    | 备注                                             |
| ------ | ------------------------ | ---------------------------------------------- |
| 投稿编号   | *(文件名)*                  | 用于生成文件名                                        |
| 投稿时间   | `date` / `updated`       | 格式 `2026.6.13` → `2026-06-13`                  |
| 毕业届数   | `author.graduationYear`  | 直接映射                                           |
| 选科组合   | `tags`（追加）               | 如 `"物化生"` 作为标签加入                               |
| 是否关联问题 | *(判断逻辑)*                 | `"是"` 时启用 `question` 字段，读取下一列                  |
| 关联问题   | `question`               | 可选；文章关联到对应问答                                   |
| 自由投稿正文 | *(正文 body)*              | `---` 之后的 Markdown 内容；同时用于推断 title、description |
| 是否匿名   | `author.anonymous`       | `"是"` → `true`，`"否"` → `false`                 |
| 展示昵称   | `author.name`            | 为空时回退为 `"匿名校友"`                                |
| 运营备注   |                          |                                                |
| 联系方式   | *(间接)*                   | 若有值，可设 `author.contactVisible: true`           |
| 文章类型   | **`tags`**               | 单值不加引号；多值用双引号包裹、以 `, ` 分隔                      |
| 其他类型   | `tags`（追加）               | 如有值，同样拆分后并入 tags                               |
| 审核情况   | `review.status`          | `"审核中"` → `"submitted"`，通过后 → `"published"`    |
|        | `title`                  | CSV 无此列，需从正文第一句推断                              |
|        | `description`            | CSV 无此列，需从正文前 110 字提取                          |
|        | `category`               | CSV 无此列，需从 tags / 正文关键词推断                      |
|        | `author.university`      | CSV 无此列                                        |
|        | `author.major`           | CSV 无此列                                        |
|        | `author.highSchoolClass` | CSV 无此列                                        |
|        | `audience`               | CSV 无此列，给默认值                                   |
|        | `review.reviewer`        | CSV 无此列                                        |
|        | `review.reviewedAt`      | CSV 无此列                                        |
|        | `display.featured`       | CSV 无此列，默认 `false`                             |
|        | `display.showDisclaimer` | CSV 无此列，默认 `true`                              |

### 特殊规则

### 文章类型 → tags 解析
- **单值**（无引号）：`专业前景与就业` → `["专业前景与就业"]`
- **多值**（双引号包裹）：`"留学考公, 各种决策纠结, 其他"` → `["留学考公", "各种决策纠结", "其他"]`

### tags 最终合并来源
1. 文章类型（CSV 列 12）
2. 其他类型（CSV 列 13）
3. 选科组合（CSV 列 4）
4. 从正文关键词推断的标签（可选，复用 `format-articles.mjs` 的 `inferTags()`）

### category 推断
复用 `format-articles.mjs` 的 `inferCategory()`，从 tags + 正文关键词映射到 7 个标准分类：
`高考备考` / `志愿填报` / `专业体验` / `大学生活` / `发展路径` / `问题回答` / `项目公告`

## 使用方法

1. 将导出的csv文件放入 `article/csv/` 
2. 执行转换：
	```bash
	npm run csv:preview # 预览
	npm run csv:convert # 转换
	```

注：默认扫描 `article/csv/` 内的所有csv，批量处理，转换后自动归档到 `article/csv/archived/` ，防止重复转换（预览时不归档）