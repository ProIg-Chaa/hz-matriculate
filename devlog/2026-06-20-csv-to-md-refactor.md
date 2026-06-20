# 重构：CSV 转换脚本拆分 + 问题 CSV 支持

## 背景

原有 `csv-to-md.mjs` 只处理文章 CSV。现在新增问题收集表，需要脚本同时支持文章和问题两种 CSV。

## 方案

将原脚本拆分为三件套：

- **`scripts/lib/csv-utils.mjs`** — 公共工具（CSV 解析、日期格式化、YAML 生成、文件归档）
- **`scripts/csv-to-articles.mjs`** — 文章逻辑（原 csv-to-md.mjs 改名重构）
- **`scripts/csv-to-questions.mjs`** — 新建，问题 CSV → MD
- **`scripts/csv-to-md.mjs`** — 新主入口，读表头自动识别类型并分发

## 问题 CSV → MD 映射

| CSV 列 | 对应字段 |
|--------|---------|
| `问题标题` | `title` |
| `问题描述` | `description`（空则取正文首句兜底） |
| `提交时间` | `date` / `updated` |
| `问题标签` | `tags[]` |
| `身份` | `asker.role` / `asker.name`（格式：匿名+身份） |
| `问题正文` | markdown 正文 |
| `自动编号` | 文件名 slug |

过滤条件：`审核情况 === "待发布"`

## 用法

```bash
# 自动识别（推荐）
node scripts/csv-to-md.mjs article/csv/xxx.csv --dry-run

# 直接调用子脚本
node scripts/csv-to-articles.mjs article/csv/xxx.csv --dry-run
node scripts/csv-to-questions.mjs article/csv/xxx.csv --dry-run
```

## 文件改动

| 文件 | 说明 |
|------|------|
| `scripts/lib/csv-utils.mjs` | 新建，公共工具库 |
| `scripts/csv-to-md.mjs` | 重写为主入口 + 自动识别分发 |
| `scripts/csv-to-articles.mjs` | 由原 csv-to-md.mjs 改名重构 |
| `scripts/csv-to-questions.mjs` | 新建，问题处理逻辑 |
