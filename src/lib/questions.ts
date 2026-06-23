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
  const normalizedSlug = slug.toLowerCase();
  const title = question.data.title.trim();

  return articles.filter(
    (article) => {
      const linkedQuestion = article.data.question?.trim();
      return (
        article.data.category === "问题回答" &&
        (linkedQuestion?.toLowerCase() === normalizedSlug || linkedQuestion === title)
      );
    }
  );
}

export function sortQuestionsByUpdatedDesc(questions: Question[]) {
  return [...questions].sort((a, b) => b.data.updated.getTime() - a.data.updated.getTime());
}

