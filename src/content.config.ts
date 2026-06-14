import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const authorSchema = z.object({
  name: z.string(),
  graduationYear: z.string().optional(),
  highSchoolClass: z.string().optional(),
  university: z.string().optional(),
  major: z.string().optional(),
  anonymous: z.boolean().default(true),
  contactVisible: z.boolean().default(false)
});

const askerSchema = z.object({
  name: z.string().default("匿名提问者"),
  role: z.string().optional(),
  anonymous: z.boolean().default(true)
});

const articles = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date(),
    category: z.enum([
      "高考备考",
      "志愿填报",
      "专业体验",
      "大学生活",
      "发展路径",
      "问题回答",
      "项目公告"
    ]),
    tags: z.array(z.string()).default([]),
    question: z.string().optional(),
    source: z.object({
      submissionId: z.string().optional()
    }).optional(),
    author: authorSchema,
    audience: z.array(z.string()).default([]),
    review: z.object({
      status: z.enum(["draft", "submitted", "editing", "reviewing", "approved", "published", "archived"]),
      reviewer: z.string().optional(),
      reviewedAt: z.coerce.date().optional()
    }),
    display: z.object({
      featured: z.boolean().default(false),
      showDisclaimer: z.boolean().default(true)
    })
  })
});

const questions = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/questions" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    asker: askerSchema,
    display: z.object({
      featured: z.boolean().default(false)
    })
  })
});

export const collections = { articles, questions };
