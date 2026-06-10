# 项目协作工作流约定

## 1. 项目协作原则

本项目由两人共同开发维护，目标是快速完成一个可上线、可维护、可持续迭代的静态网站。

协作时遵循以下原则：

* `main` 分支始终保持可运行、可部署状态。
* 所有功能开发、页面修改、样式调整都通过独立分支完成。
* 不直接向 `main` 分支提交代码。
* 每次修改尽量小而清晰，避免一次提交混入多个无关改动。
* 重要改动必须经过 Pull Request 讨论和检查后再合并。
* 内容、页面、组件、样式的责任边界尽量清楚，减少互相覆盖。

---

## 2. 分支管理规范

### 2.1 主分支

项目长期保留以下主分支：

```text
main
```

`main` 分支代表当前稳定版本，应该随时可以部署。

禁止直接在 `main` 分支上开发，除非是极小的紧急修复，并且需要提前说明。

---

### 2.2 开发分支命名

所有新任务都从 `main` 创建新分支。

分支命名格式：

```text
类型/简短描述
```

常用类型：

```text
feature/    新功能
fix/        Bug 修复
content/    内容更新
style/      样式调整
docs/       文档修改
refactor/   代码重构
chore/      配置、依赖、杂项
```

示例：

```text
feature/homepage-layout
feature/search-page
content/gaokao-experience-template
style/mobile-navbar
fix/image-path-error
docs/workflow-guide
```

---

## 3. Issue 使用规范

所有明确任务尽量先创建 Issue，再开发。

Issue 用来记录：

* 要做什么；
* 为什么要做；
* 谁负责；
* 当前进度；
* 相关讨论。

Issue 标题应简洁明确，例如：

```text
设计首页基础布局
添加投稿入口页面
整理第一批校友经验文章
修复移动端导航栏错位
接入 Pagefind 搜索
```

Issue 内容建议包含：

```markdown
## 目标

说明这个任务要完成什么。

## 具体要求

- 要求 1
- 要求 2
- 要求 3

## 验收标准

- [ ] 页面可以正常显示
- [ ] 移动端没有明显错位
- [ ] 不影响现有页面
```

任务开始前，在 Issue 下留言认领：

```text
我来做这个。
```

避免两个人同时做同一件事。

---

## 4. 本地开发流程

每次开始新任务前，先同步最新代码：

```bash
git checkout main
git pull origin main
```

然后创建新分支：

```bash
git checkout -b feature/homepage-layout
```

开发过程中可以正常提交：

```bash
git add .
git commit -m "feat: add homepage layout"
```

推送到远程：

```bash
git push origin feature/homepage-layout
```

然后在 GitHub 上创建 Pull Request。

---

## 5. Commit 提交规范

提交信息使用简洁英文或中文均可，但格式要统一。

推荐格式：

```text
类型: 简短说明
```

常用类型：

```text
feat: 新功能
fix: 修复问题
docs: 文档修改
style: 样式调整
content: 内容更新
refactor: 重构
chore: 配置或杂项
```

示例：

```text
feat: add homepage hero section
fix: correct broken image path
content: add volunteer application article
style: improve mobile card layout
docs: add contribution workflow
chore: update dependencies
```

一次提交只做一类事情。不要出现这种提交：

```text
update
改了一些东西
final version
乱七八糟修一下
```

这类提交后期很难追踪问题。

---

## 6. Pull Request 规范

所有开发分支合并到 `main` 前，必须创建 Pull Request。

PR 标题格式：

```text
类型: 修改内容
```

示例：

```text
feat: add homepage layout
content: add first alumni experience article
fix: resolve mobile navigation overflow
```

PR 描述建议包含：

```markdown
## 修改内容

- 修改了什么
- 新增了什么
- 删除了什么

## 检查项

- [ ] 本地可以正常运行
- [ ] 页面没有明显样式错误
- [ ] 没有无关文件被提交
- [ ] 移动端基本可用

## 关联 Issue

Closes #编号
```

如果是页面或样式改动，建议附上截图，方便对方 review。

---

## 7. Code Review 约定

两人协作时，PR 至少需要另一人查看后再合并。

Review 时重点看：

* 是否实现了 Issue 中的目标；
* 是否影响已有页面；
* 是否有明显命名混乱；
* 是否引入不必要的复杂度；
* 是否存在重复代码；
* 是否有无法加载的图片、链接或资源；
* 移动端是否有明显错位。

Review 不追求形式主义，但要避免明显问题直接进入 `main`。

如果问题较小，可以评论：

```text
这里建议改一下命名。
这个组件可以先不抽象。
图片路径可能部署后会失效。
移动端这里可能会溢出。
```

如果没有问题，可以评论：

```text
LGTM
```

然后合并。

---

## 8. 合并策略

推荐使用 GitHub 的：

```text
Squash and merge
```

这样可以把一个分支上的多个零碎 commit 压成一个清晰的主线提交。

合并后删除远程分支，保持仓库干净。

---

## 9. 冲突处理规则

如果开发分支和 `main` 发生冲突，原则上由该分支负责人解决。

处理流程：

```bash
git checkout main
git pull origin main

git checkout 当前开发分支
git merge main
```

解决冲突后：

```bash
git add .
git commit -m "fix: resolve merge conflict"
git push origin 当前开发分支
```

如果冲突涉及对方负责的文件，不要盲目覆盖，先沟通确认。

---

## 10. 文件责任边界

为了减少冲突，开发时尽量避免两人同时修改同一批文件。

建议初期分工：

```text
成员 A：
- 项目框架
- 页面结构
- 部署配置
- 首页和导航

成员 B：
- 内容模板
- 文章整理
- 标签体系
- 投稿页面
```

如果某个任务需要修改对方主要负责的部分，应提前在 Issue 或聊天中说明。

---

## 11. 内容更新规范

所有文章内容建议使用 Markdown 管理。

文章文件命名：

```text
年份-主题-简短描述.md
```

示例：

```text
2024-cs-major-review.md
2025-gaokao-math-experience.md
2023-volunteer-application-review.md
```

文章头部建议包含元信息：

```yaml
---
title: "软件工程专业真实体验"
year: 2024
category: "大学专业"
tags: ["计算机", "软件工程", "专业选择"]
anonymous: true
updated: "2026-06-10"
---
```

内容修改也走 PR，不直接改 `main`。

---

## 12. 部署约定

`main` 分支用于自动部署。

一般流程：

```text
PR 合并到 main
↓
触发 Cloudflare Pages / Vercel / GitHub Pages 自动构建
↓
网站更新
```

部署失败时，优先检查：

* 是否有构建报错；
* 是否有依赖未安装；
* 是否有图片路径错误；
* 是否有 Markdown frontmatter 格式错误；
* 是否有大小写路径问题。

如果线上页面异常，应立即创建 `fix/xxx` 分支修复，不要在 `main` 上直接乱改。

---

## 13. 敏感信息管理

禁止把以下内容提交到 GitHub：

```text
.env
API Key
Token
账号密码
个人手机号
校友联系方式
未公开的投稿原始表格
```

如果需要环境变量，使用：

```text
.env.example
```

示例：

```text
PUBLIC_SITE_NAME=
PUBLIC_FORM_URL=
```

真实 `.env` 文件必须加入 `.gitignore`。

---

## 14. 项目沟通规则

小问题可以直接在聊天中沟通。

重要问题要沉淀到 Issue 或 PR，包括：

* 页面结构变化；
* 栏目调整；
* 技术栈变更；
* 部署方式变更；
* 内容审核标准；
* 是否公开某些信息。

避免所有决策都散落在聊天记录里，后期会找不到。

---

## 15. 推荐开发节奏

每次开发尽量控制在一个小任务内。

推荐节奏：

```text
创建 Issue
↓
认领任务
↓
从 main 创建分支
↓
本地开发
↓
提交 commit
↓
推送分支
↓
创建 PR
↓
对方 review
↓
合并到 main
↓
自动部署
```

不要长期在一个大分支里堆很多功能。
如果一个任务超过两三天还没完成，应该拆成更小的 Issue。

---

## 16. 最小协作纪律

两人项目最重要的是保持以下纪律：

* 开发前先 `git pull`。
* 不直接改 `main`。
* 一个任务一个分支。
* 一个 PR 只解决一个问题。
* 合并前让对方看一眼。
* 不提交密钥、隐私数据、无关文件。
* 线上出问题优先修复，不在主分支上试错。
