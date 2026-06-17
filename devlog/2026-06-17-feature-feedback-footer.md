# 页脚意见反馈链接

## 改动

页脚新增"意见反馈"链接，点击后在新标签页打开外部反馈表单。

链接地址通过 `.env` 中的 `PUBLIC_FEEDBACK_URL` 配置，未配置时不显示。

## 涉及文件

| 文件 | 说明 |
|------|------|
| `src/layouts/BaseLayout.astro` | 页脚免责文字后添加条件渲染的反馈链接 |
| `.env` / `.env.example` | 新增 `PUBLIC_FEEDBACK_URL` 变量 |
