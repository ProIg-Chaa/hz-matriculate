# CSV → MD 字段映射

## 问题

来自匿名改进建议：

“刷首页的时候有个感受——所有卡片长得太像了。“精选文章”和“最新更新”两个板块里的卡片，样式完全一样，扫过去分不出来哪篇是你想重点推的、哪篇就是按时间排的。”

## 改进方案：卡片视觉区分

- ArticleCard.astro——新增 featured prop（默认 false），使用 class:list 条件添加 featured class
- global.css——新增 .article-card.featured，左侧 3px 暖色 accent 边线 + 渐变暖色背景
- index.astro——精选文章区域传 featured={true}