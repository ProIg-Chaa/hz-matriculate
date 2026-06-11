# 霁湖行舟

霁湖行舟是一个面向高中生与毕业校友的公益性经验分享站，旨在把大学与高中之间常常难以被看见的信息差，整理成可以持续检索、阅读和维护的公开资料。

项目关注的不只是志愿填报，也包括专业学习、校园日常、衣食住行、城市体验、成长选择与后续发展路径。我们希望每一位后来者在做选择之前，都能多看见一些真实处境：不必只依赖招生简章、平台宣传或零散传闻，也不必把每一次分享都写成严肃长文。

## 项目定位

- **真实经验沉淀**：收集校友基于个人经历写下的观察、复盘、提醒与建议。
- **信息差补足**：帮助高中生理解大学里的专业、城市、生活成本、学习方式与发展路径。
- **轻量内容维护**：使用 Markdown 管理内容，优先保证结构清晰、部署简单、后续可扩展。
- **公益与非官方**：本站为校友自发维护项目，并非学校官方平台；涉及招生政策与录取信息时，请以官方发布为准。

## 技术栈

当前版本采用稳定、轻量的静态站方案：

- [Astro](https://astro.build/)：页面生成与路由组织
- Markdown Content Collections：文章内容建模与 frontmatter 校验
- Pagefind：静态搜索与标签筛选
- GitHub Pages：静态部署
- 原生 CSS：全站视觉系统与响应式布局

项目暂不引入数据库、登录系统、评论系统、在线后台或复杂推荐逻辑，以保持主干稳定。

## 本地开发

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

构建静态站点并生成搜索索引：

```bash
npm run build
```

预览构建结果：

```bash
npm run preview
```

## 环境变量

复制 `.env.example` 为 `.env` 后按需填写：

```text
PUBLIC_SITE_NAME=
PUBLIC_SITE_DESCRIPTION=
PUBLIC_SUBMISSION_FORM_URL=
```

投稿表单链接尚未确定时可以留空，页面会显示占位提示。

## 内容维护

文章位于：

```text
src/content/articles/
```

每篇文章使用 Markdown 编写，并通过 `src/content.config.ts` 中的 schema 校验。当前 Article frontmatter 包含：

```text
title
description
date
updated
category
tags
author
audience
review
display
```

示例文章仅用于验证结构、列表、详情页、搜索与标签筛选效果，后续可替换为真实校友投稿。

## 路由概览

```text
/                      首页
/articles/             文章列表
/articles/[slug]/      文章详情
/categories/[category]/ 分类页
/search/               搜索与标签筛选
/submit/               投稿说明
/about/                关于项目
/disclaimer/           免责声明
/404/                  未找到页面
```

## 协作约定

项目协作规则见：

```text
CONTRIBUTING.md
```

核心约定：

- `main` 分支保持可部署状态。
- 常规功能、样式、内容修改通过独立分支和 Pull Request 合并。
- 每一次正式提交必须同步添加或更新 `devlog/` 下的 Markdown 记录。
- 不提交 `.env`、密钥、账号密码、私人联系方式或未公开投稿原始数据。

## 项目边界

当前主干专注于静态内容站的稳定骨架，包括内容模型、基础页面、文章列表、文章详情、分类页、搜索与标签筛选。

暂不包含：

- 登录与用户系统
- 评论与收藏
- 数据库
- 在线投稿后台
- AI 问答或动态推荐
- 复杂多维筛选面板

这些能力如有需要，应在后续迭代中单独设计、评估和接入。

