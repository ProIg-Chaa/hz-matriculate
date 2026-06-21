# 修复：文章列表页首次加载白屏

## 问题

文章页首次打开时卡片不显示，需要滚动一下才出现。

## 原因

`BaseLayout.astro` 的入场动画脚本用 IntersectionObserver 控制元素显隐。页面加载时所有匹配元素先被设为 `opacity: 0`，等 observer 异步回调再加 `.is-visible` 恢复。由于回调有延迟，且 `<section>` 自身也是 reveal target，其 `opacity: 0` 级联到所有子元素，导致首屏白屏。

## 修复

在 observer 注册后，立即同步检查已在视口内的元素，直接添加 `is-visible` 并取消观察，不再等待异步回调。

## 文件改动

| 文件 | 说明 |
|------|------|
| `src/layouts/BaseLayout.astro` | observer 后增加首屏同步显隐检查 |
