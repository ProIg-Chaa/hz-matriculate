import type { CollectionEntry } from "astro:content";
import type { Article } from "./articles";

export type Question = CollectionEntry<"questions">;

export function getQuestionSlug(question: Question) {
  return question.id.replace(/\.(md|mdx)$/, "");
}

export function getQuestionUrl(question: Question) {
  return `/questions/${getQuestionSlug(question)}/`;
}

export function getQuestionAskerLabel(question: Question) {
  return question.data.asker.anonymous ? "匿名提问者" : question.data.asker.name;
}

export function getAnswersForQuestion(question: Question, articles: Article[]) {
  const slug = getQuestionSlug(question);
  return articles.filter((article) => article.data.category === "问题回答" && article.data.question === slug);
}

export function sortQuestionsByUpdatedDesc(questions: Question[]) {
  return [...questions].sort((a, b) => b.data.updated.getTime() - a.data.updated.getTime());
}

