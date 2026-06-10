# 高中校友升学经验库

一个面向高中生、校友和维护者的静态经验资料库，用于沉淀高考备考、志愿填报、专业体验、大学生活与发展路径相关内容。

第一版采用 Astro + Markdown，优先保证内容结构清楚、部署简单、后续容易扩展。

## 本地开发

```bash
npm install
npm run dev
```

常用命令：

```bash
npm run build
npm run preview
```

## 环境变量

复制 `.env.example` 为 `.env` 后按需填写：

```text
PUBLIC_SITE_NAME=
PUBLIC_SITE_DESCRIPTION=
PUBLIC_SUBMISSION_FORM_URL=
```

投稿表单链接暂未确定时，可以留空。页面会显示占位提示。

## 内容维护

文章放在 `src/content/articles/`，使用 Markdown 或 MDX。

每篇文章通过 `src/content.config.ts` 中的 schema 校验，必须包含标题、摘要、日期、分类、标签、作者展示信息、审核状态和展示控制字段。

示例文章仅用于验证结构和页面效果，后续可以替换为真实校友内容。

## 项目边界

当前主干不包含登录、评论、数据库、在线投稿后台、复杂筛选、AI 问答或动态推荐。搜索页已预留，后续可单独接入 Pagefind。
