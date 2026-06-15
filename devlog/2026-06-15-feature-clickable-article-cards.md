# 文章卡片可点击

### 问题

首页"精选文章""最新更新""先从一个问题开始"区域的 `ArticleCard` / `QuestionCard` 组件，仅标题文字是可点击的链接，卡片其余区域（meta、描述、标签）不可点击。

### 方案：CSS Stretched Link

不改动组件结构，利用 `::after` 伪元素让标题 `<a>` 覆盖整个卡片：

- `.article-card` 加 `position: relative` 作为定位锚点
- 标题 `<a>` 的 `::after` 设为 `position: absolute; inset: 0; z-index: 0`，铺满整卡
- `.meta` 和 `.chips` 加 `position: relative; z-index: 1`，让文字浮动在透明层上方，保持可选

### 涉及文件

| 文件 | 说明 |
|------|------|
| `src/styles/global.css` | `.article-card`、`::after`、`.meta`、`.chips` 共 4 处 CSS 改动 |
