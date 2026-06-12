export const categories = [
  {
    slug: "gaokao",
    name: "高考备考",
    description: "复习节奏、学科方法、备考心态与踩坑复盘。"
  },
  {
    slug: "application",
    name: "志愿填报",
    description: "学校、专业、城市与分数段选择的真实回看。"
  },
  {
    slug: "majors",
    name: "专业体验",
    description: "大学专业实际学习内容、压力、出路与适配人群。"
  },
  {
    slug: "university-life",
    name: "大学生活",
    description: "校园、城市、生活成本、社交和高中到大学的转变。"
  },
  {
    slug: "pathways",
    name: "发展路径",
    description: "转专业、保研、考研、就业和实习等后续路径。"
  },
  {
    slug: "question-answers",
    name: "问题回答",
    description: "围绕高中生和应届生真实问题整理的回答与补充。"
  },
  {
    slug: "announcements",
    name: "项目公告",
    description: "项目更新、维护说明和重要提醒。"
  }
] as const;

export type CategorySlug = (typeof categories)[number]["slug"];

export function getCategoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}
