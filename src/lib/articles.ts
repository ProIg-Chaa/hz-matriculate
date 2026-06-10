import type { CollectionEntry } from "astro:content";

export type Article = CollectionEntry<"articles">;

export function getArticleSlug(article: Article) {
  return article.id.replace(/\.(md|mdx)$/, "");
}

export function getArticleUrl(article: Article) {
  return `/articles/${getArticleSlug(article)}/`;
}

export function sortArticlesByUpdatedDesc(articles: Article[]) {
  return [...articles].sort((a, b) => b.data.updated.getTime() - a.data.updated.getTime());
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC"
  }).format(date);
}
