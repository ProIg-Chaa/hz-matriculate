import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(rootDir, "article", "source");
const formattedDir = path.join(rootDir, "article", "formatted");
const force = process.argv.includes("--force");

const categorySlugs = {
  "高考备考": "gaokao",
  "志愿填报": "application",
  "专业体验": "major-review",
  "大学生活": "university-life",
  "发展路径": "pathways",
  "项目公告": "announcement"
};

const tagRules = [
  ["志愿填报", ["志愿", "填志愿", "填报", "提前批", "普通批", "录取", "分数线", "排位"]],
  ["学校选择", ["大学", "院校", "学校", "三峡大学"]],
  ["专业选择", ["专业", "喜欢的专业", "报考"]],
  ["家庭沟通", ["父母", "家长", "亲戚"]],
  ["大学生活", ["大学生活", "大学", "青春生活"]],
  ["作息", ["作息", "早八", "早读", "起床"]],
  ["社交", ["社交", "社团", "学生组织", "舍友", "朋友", "恋爱"]],
  ["学习体验", ["课程", "数学", "编程", "实验", "论文", "绩点"]],
  ["高考备考", ["高考", "备考", "复习", "考试"]],
  ["心态调整", ["焦虑", "不安", "心态", "放松"]],
  ["专业体验", ["文科", "理科", "汉语言", "师范生", "Python", "微积分"]]
];

function splitFrontmatter(input) {
  const normalized = input.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!match) {
    return { frontmatter: {}, body: normalized };
  }

  return {
    frontmatter: parseSimpleFrontmatter(match[1]),
    body: match[2].trim()
  };
}

function parseSimpleFrontmatter(raw) {
  const data = {};
  const lines = raw.split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const scalar = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!scalar) continue;

    const [, key, value] = scalar;
    if (value === "") {
      const values = [];
      while (lines[index + 1]?.match(/^\s*-\s+/)) {
        index += 1;
        values.push(cleanYamlValue(lines[index].replace(/^\s*-\s+/, "")));
      }
      data[key] = values;
      continue;
    }

    data[key] = cleanYamlValue(value);
  }

  return data;
}

function cleanYamlValue(value) {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return trimmed.replace(/^["']|["']$/g, "");
}

function normalizeBody(body) {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .join("\n\n");
}

function firstText(body) {
  return body.replace(/[#>*_`[\]()]/g, "").replace(/\s+/g, " ").trim();
}

function clipText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function inferCategory(text, frontmatter) {
  if (frontmatter.category && categorySlugs[frontmatter.category]) return frontmatter.category;

  const scores = {
    "志愿填报": score(text, ["志愿", "填志愿", "填报", "提前批", "普通批", "录取", "分数线", "排位"]),
    "大学生活": score(text, ["大学生活", "早八", "社团", "舍友", "作息", "青春生活", "恋爱"]),
    "专业体验": score(text, ["专业", "文科", "理科", "课程", "实验", "编程", "论文", "汉语言"]),
    "高考备考": score(text, ["高考", "备考", "复习", "考试", "学科"]),
    "发展路径": score(text, ["保研", "考研", "就业", "实习", "转专业"])
  };

  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[1] > 0
    ? Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]
    : "大学生活";
}

function score(text, keywords) {
  return keywords.reduce((total, keyword) => total + (text.includes(keyword) ? 1 : 0), 0);
}

function inferTags(text, category, frontmatter) {
  if (Array.isArray(frontmatter.tags) && frontmatter.tags.length > 0) {
    return [...new Set(frontmatter.tags)].slice(0, 5);
  }

  const tags = [category];
  for (const [tag, keywords] of tagRules) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      tags.push(tag);
    }
  }

  return [...new Set(tags)].slice(0, 5);
}

function inferTitle(text, category, frontmatter) {
  if (frontmatter.title) return frontmatter.title;

  if (category === "志愿填报") return "填志愿前，请先开始为自己负责";
  if (category === "大学生活") return "大学生活不必只有一种标准答案";
  if (category === "专业体验") return "一段真实的专业学习体验";
  if (category === "高考备考") return "高考之后仍值得认真做的事";

  const sentence = text.split(/[。！？!?]/)[0]?.trim();
  return clipText(sentence || "未命名投稿", 28);
}

function inferDescription(text, frontmatter) {
  if (frontmatter.description) return frontmatter.description;
  const firstSentence = text.split(/[。！？!?]/)[0]?.trim();
  return clipText(firstSentence || text, 110);
}

function buildOutputName(sourceName, category, title) {
  const sourceBase = path.basename(sourceName, path.extname(sourceName)).replace(/[^A-Za-z0-9_-]+/g, "-");
  const categorySlug = categorySlugs[category] || "article";
  const titleHint = asciiHint(title);
  const parts = [sourceBase || "article", categorySlug, titleHint].filter(Boolean);
  return `${parts.join("-").toLowerCase()}.md`;
}

function asciiHint(title) {
  if (title.includes("志愿")) return "volunteer-application";
  if (title.includes("大学生活")) return "university-life";
  if (title.includes("专业")) return "major-review";
  if (title.includes("高考")) return "gaokao";
  return "";
}

function quoteYaml(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function yamlList(values, indent = "") {
  if (!values || values.length === 0) return `${indent}[]`;
  return values.map((value) => `${indent}- ${quoteYaml(value)}`).join("\n");
}

function buildArticle({ title, description, category, tags, body, today }) {
  return `---\n${[
    `title: ${quoteYaml(title)}`,
    `description: ${quoteYaml(description)}`,
    `date: ${quoteYaml(today)}`,
    `updated: ${quoteYaml(today)}`,
    `category: ${quoteYaml(category)}`,
    "tags:",
    yamlList(tags, "  "),
    "author:",
    `  name: ${quoteYaml("匿名校友")}`,
    `  anonymous: true`,
    `  contactVisible: false`,
    "audience:",
    yamlList(["希望了解真实经验的高中生", "准备做升学或大学生活选择的读者"], "  "),
    "review:",
    `  status: ${quoteYaml("editing")}`,
    "display:",
    "  featured: false",
    "  showDisclaimer: true"
  ].join("\n")}\n---\n\n${body}\n`;
}

async function main() {
  await mkdir(formattedDir, { recursive: true });
  const entries = await readdir(sourceDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && /\.mdx?$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "zh-CN"));

  if (files.length === 0) {
    console.log("No source articles found.");
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  let written = 0;
  let skipped = 0;

  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const raw = await readFile(sourcePath, "utf8");
    const { frontmatter, body } = splitFrontmatter(raw);
    const formattedBody = normalizeBody(body);
    const text = firstText(formattedBody);
    const category = inferCategory(text, frontmatter);
    const tags = inferTags(text, category, frontmatter);
    const title = inferTitle(text, category, frontmatter);
    const description = inferDescription(text, frontmatter);
    const outputName = buildOutputName(file, category, title);
    const outputPath = path.join(formattedDir, outputName);

    if (!force && await exists(outputPath)) {
      console.log(`skip ${path.relative(rootDir, outputPath)} already exists`);
      skipped += 1;
      continue;
    }

    const output = buildArticle({
      title,
      description,
      category,
      tags,
      body: formattedBody,
      today
    });

    await writeFile(outputPath, output, "utf8");
    console.log(`${force ? "write" : "create"} ${path.relative(rootDir, outputPath)}`);
    written += 1;
  }

  console.log(`Done. ${written} written, ${skipped} skipped.`);
}

async function exists(filePath) {
  try {
    await readFile(filePath, "utf8");
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
