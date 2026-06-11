# 2026-06-10 UI 极简高级感优化

## 背景

本次迭代目标是在不扩张内容模型和产品功能的前提下，优化网站的视觉质感与轻交互。范围限定为排版、配色、留白、卡片层次、hover 微交互、滚动淡入和搜索 UI 风格统一。

## 完成内容

- 重整全局视觉变量，改为低饱和、中性色为主的配色体系。
- 优化标题与正文排版：
  - 标题使用系统衬线字体栈。
  - 正文继续使用系统无衬线字体栈。
  - 调整页面标题、文章标题和正文间距。
- 统一卡片、文章卡片、信息面板和正文容器的圆角、细线、浅阴影与 hover 状态。
- 首页分类卡片、文章卡片、按钮、搜索框增加轻微 hover / focus 反馈。
- 新增基于 IntersectionObserver 的滚动淡入效果。
- 尊重 `prefers-reduced-motion: reduce`，减少动画偏好下关闭主要过渡与位移动效。
- 优化 Pagefind 搜索 UI，使搜索框和结果卡片与全站视觉一致。
- 将网站整体切换为暗色系视觉，使用深灰黑背景、柔和白灰文字、冷蓝强调色和柔和橙色提示色。
- 新增 CSS-only 低饱和动态渐变背景，不引入粒子、Three.js 或额外运行时依赖。

## 重要取舍

- 未新增封面图字段，避免增加内容维护成本和图片风格统一问题。
- 未新增筛选、收藏、分享、无限滚动、实时建议等产品功能。
- 未新增 UI 框架、图标库或外部字体依赖。
- 滚动淡入仅作为展示增强；如果 JavaScript 不可用，内容仍保持可见。
- 背景特效选择大面积慢速线性渐变，而不是粒子、星空、形状漂浮或三维效果，避免削弱内容站的安静可信气质。
- 暗色方案遵循“深灰层次 + 柔和对比 + 少量冷蓝 glow”的方向，避免纯黑白高反差带来的刺眼感。
- 暗色主题作为当前默认视觉，不新增主题切换，以控制复杂度。
- 本次执行过程中明确了标准工作流：实现类任务必须先从最新 `main` 创建任务分支，不能直接在 `main` 上开发；如果已经误在 `main` 上产生未提交改动，应立即 `git checkout -b feature/当前任务名` 把工作区转移到新分支。

## 验证记录

- `npm run build` 通过，Astro、sitemap、Pagefind 均成功构建。
- `npm audit` 通过，结果为 0 vulnerabilities。
- 本地预览检查了首页、文章列表、文章详情、分类页、搜索页、投稿页、关于页和免责声明页。
- Playwright CLI 检查桌面、平板、手机宽度下关键页面均无横向溢出。
- Pagefind 搜索 UI 在 `npm run build && npm run preview` 后可正常加载。
- 修正了搜索页原先导入 `/pagefind/pagefind.js` 导致 `PagefindUI` 不可用的问题，改为加载 `/pagefind/pagefind-ui.js` 与 `/pagefind/pagefind-ui.css`。
- 暗色主题与动态渐变背景仍需在本地预览中复查桌面、平板、手机宽度下的可读性和横向溢出。
- 深灰暗色方案调整后，`npm run build` 与 `npm audit` 再次通过。
- 本地预览关键页 `/`、`/articles/example-major-review/`、`/search/` 均返回 200。
- Playwright snapshot 确认搜索页显示真实 Pagefind 搜索框，而不是 fallback 文案。

## 验证问题与经验

- Playwright CLI 在本地第一次启动时出现 daemon 退出和 browser session 丢失，需要先执行 `playwright-cli close-all` / `playwright-cli kill-all` 后重新 `open`。
- PowerShell 中调用 `playwright-cli eval` 时，复杂 JavaScript 对象和选择器容易被引号拆坏；后续优先使用简单表达式逐项检查，或改用稳定脚本文件/Node Playwright 方式。
- `playwright-cli run-code` 与普通 Playwright 脚本语义不同，不能直接照写 `const checks = ...` 或依赖外部 `page` 变量；本次因此浪费了验证时间。
- 搜索页必须先 `npm run build` 生成 `dist/pagefind/`，再 `npm run preview` 检查；仅用 `npm run dev` 无法验证 Pagefind UI。
- Pagefind 的 `/pagefind/pagefind-ui.js` 是浏览器脚本，会挂载 `window.PagefindUI`，不是 ESM named export；不能用 `await import(...).PagefindUI` 判断。
- 搜索页 UI 检查不要只看页面 200 或 fallback 文案，要明确检查 `.pagefind-ui` 和 `.pagefind-ui__search-input` 是否存在。
- 后续类似 UI 验证建议先列最小检查矩阵：构建、审计、关键路由、桌面/移动横向溢出、搜索 UI 是否加载，再逐项执行，避免在工具细节上绕太久。
