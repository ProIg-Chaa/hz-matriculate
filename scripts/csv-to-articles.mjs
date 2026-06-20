import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  rootDir, defaultCsvDir, archiveDir,
  parseCSV, rowToRecord,
  parseDate, parseMultiValue,
  clipText, firstSentence,
  quoteYaml, yamlList, uniqueValues,
  exists, collectCsvFiles, archiveCsv,
  parseCliArgs
} from "./lib/csv-utils.mjs";

// ── Config ──────────────────────────────────────────────────────────

const defaultOutDir = path.join(rootDir, "src", "content", "articles");

const categorySlugs = {
  "高考备考": "gaokao",
  "志愿填报": "application",
  "专业体验": "major-review",
  "大学生活": "university-life",
  "发展路径": "pathways",
  "问题回答": "question-answer",
  "项目公告": "announcement"
};

const categoryHints = {
  "志愿填报": ["志愿", "填报", "录取", "分数线", "排位", "提前批", "普通批"],
  "大学生活": ["大学生活", "大学", "宿舍", "社团", "作息", "早八", "舍友"],
  "专业体验": ["专业", "课程", "实验", "编程", "论文", "就读"],
  "高考备考": ["高考", "备考", "复习", "考试", "心态"],
  "发展路径": ["保研", "考研", "就业", "实习", "转专业", "留学", "考公", "出国"]
};

// ── 问题标题→slug 映射（仅文章需要） ────────────────────────────────

async function buildQuestionTitleToSlugMap() {
  const questionsDir = path.join(rootDir, "src", "content", "questions");
  const map = new Map();

  try {
    const { readdir: ls } = await import("node:fs/promises");
    const entries = await ls(questionsDir, { withFileTypes: true });
    const mdFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".md"));

    for (const file of mdFiles) {
      const content = await readFile(path.join(questionsDir, file.name), "utf8");
      const titleMatch = content.match(/^title:\s*(?:"([^"]*)"|'([^']*)'|(.+))$/m);
      if (titleMatch) {
        const title = (titleMatch[1] || titleMatch[2] || titleMatch[3]).trim();
        const slug = file.name.replace(/\.md$/, "");
        map.set(title, slug);
      }
    }
  } catch {
    console.warn("⚠  无法读取问题目录，跳过问题关联映射。");
  }

  return map;
}

// ── 文章专用字段 ────────────────────────────────────────────────────

function inferTitle(body) {
  const sentence = firstSentence(body);
  return clipText(sentence || "未命名投稿", 28);
}

function extractSummaryLine(body) {
  const lines = body.split("\n");
  let inSummary = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^[一二三四五六七八九十\d]+[、.．]\s*一句话总结/.test(trimmed)) {
      inSummary = true;
      continue;
    }

    if (!inSummary) continue;

    if (/^[一二三四五六七八九十\d]+[、.．]/.test(trimmed) && trimmed.length > 4) {
      break;
    }

    if (!trimmed) continue;
    if (trimmed.length < 8) continue;
    if (/^(对|想|请|说|给)/.test(trimmed) && trimmed.length < 35) continue;

    return trimmed;
  }

  return null;
}

function isMetadataLine(line) {
  if (/^[一二三四五六七八九十\d]+[、.．]\s*(我的|这条|我为什么|踩过|对应|一句话|本次)/.test(line)) {
    return true;
  }
  if (/^(个人信息|基本情况|投稿编号|填报工具)[：:]/.test(line)) return true;

  const sepCount = (line.match(/[\/—：:｜]/g) || []).length;
  if (sepCount >= 3 && line.length < 150) return true;

  return false;
}

function inferDescription(body) {
  const summary = extractSummaryLine(body);
  if (summary) return clipText(summary, 110);

  const lines = body.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (isMetadataLine(trimmed)) continue;
    if (trimmed.length < 15) continue;
    return clipText(trimmed, 110);
  }

  const plain = body.replace(/[#>*_`[\]()\n\r]/g, "").replace(/\s+/g, " ").trim();
  return clipText(plain || "暂无描述", 110);
}

function inferCategory(tags, body) {
  for (const tag of tags) {
    for (const [category, keywords] of Object.entries(categoryHints)) {
      if (keywords.some((kw) => tag.includes(kw))) {
        return category;
      }
    }
  }

  const bodyScores = {};
  for (const [category, keywords] of Object.entries(categoryHints)) {
    bodyScores[category] = keywords.reduce(
      (sum, kw) => sum + (body.includes(kw) ? 1 : 0),
      0
    );
  }

  const best = Object.entries(bodyScores).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : "大学生活";
}

function asciiHint(title) {
  const hints = [
    [/志愿|填报|录取|提前批|普通批/, "volunteer-application"],
    [/大学生活|大学|宿舍|社团|作息/, "university-life"],
    [/专业|课程|实验|就读/, "major-review"],
    [/高考|备考|复习/, "gaokao"],
    [/保研|考研|就业|留学|考公|出国|实习/, "pathways"],
    [/问题|回答|问答/, "question-answer"]
  ];
  for (const [pattern, hint] of hints) {
    if (pattern.test(title)) return hint;
  }
  return "";
}

function buildFilename(id, category, title) {
  const num = String(id).padStart(2, "0");
  const catSlug = categorySlugs[category] || "article";
  const hint = asciiHint(title);
  const parts = [num, catSlug, hint].filter(Boolean);
  return `${parts.join("-").toLowerCase()}.md`;
}

function buildGraduationYearTag(raw) {
  const value = raw.trim();
  if (!value) return null;
  return value.endsWith("届") ? value : `${value}届`;
}

function buildSubjectComboTag(raw) {
  const subjects = parseMultiValue(raw);
  if (subjects.length <= 1) return subjects[0] || null;

  const shortNames = {
    "物理": "物",
    "化学": "化",
    "生物": "生",
    "历史": "史",
    "地理": "地",
    "政治": "政"
  };

  return subjects.map((subject) => shortNames[subject] || subject).join("");
}

function extractBodyField(body, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = body.match(new RegExp(`(?:^|\\n)\\s*(?:\\d+[.、]\\s*)?${escapedLabel}[：:]\\s*([^\\n\\r]+)`));
  return match ? match[1].trim() : null;
}

function extractTemplateTagFields(body) {
  return uniqueValues([
    extractBodyField(body, "当前年级/状态"),
    extractBodyField(body, "本次分享重点")
  ]);
}

// ── 构建文章 ────────────────────────────────────────────────────────

function buildArticle(record, questionSlugMap) {
  const shouldShowSchoolInfo = record["是否展示位次，院校与专业"] === "是";
  const publicSchoolInfoTags = shouldShowSchoolInfo
    ? [record["高考位次"], record["就读院校"], record["就读专业"]]
    : [];
  const tags = uniqueValues([
    ...parseMultiValue(record["文章类型"] || ""),
    ...parseMultiValue(record["其他类型"] || ""),
    buildGraduationYearTag(record["毕业届数"] || ""),
    buildSubjectComboTag(record["选科组合"] || ""),
    ...parseMultiValue(record["选科组合"] || ""),
    ...publicSchoolInfoTags
  ]);

  const body = (record["自由投稿正文"] || "").trim()
    .replace(/\n/g, "\n\n")
    .replace(/\n{3,}/g, "\n\n");

  const hasQuestion = record["是否关联问题"] === "是" && record["关联问题"]?.trim() && record["关联问题"] !== "无";
  let questionSlug = null;
  if (hasQuestion) {
    const questionTitle = record["关联问题"].trim();
    questionSlug = questionSlugMap.get(questionTitle);
    if (!questionSlug) {
      console.warn(`  ⚠  问题标题未匹配: "${questionTitle}"，跳过 question 字段。`);
    }
  }

  tags.push(...extractTemplateTagFields(body));
  const category = questionSlug ? "问题回答" : inferCategory(tags, body);
  const title = inferTitle(body);
  const description = inferDescription(body);
  const dateStr = record["投稿时间"] ? parseDate(record["投稿时间"]) : new Date().toISOString().slice(0, 10);
  const isAnonymous = record["是否匿名"] === "是";
  const displayName = record["展示昵称"]?.trim() || "匿名校友";
  const hasContact = !!(record["联系方式"]?.trim());

  const reviewStatusMap = {
    "待审核": "submitted",
    "拟通过": "published",
    "审核中": "submitted",
    "已通过": "published",
    "已发布": "published",
    "草稿": "draft",
    "退回": "draft"
  };
  const reviewStatus = reviewStatusMap[record["审核情况"]?.trim()] || "submitted";
  const isFeatured = record["是否精选"]?.trim() === "是";

  const frontmatter = [
    `title: ${quoteYaml(title)}`,
    `description: ${quoteYaml(description)}`,
    `date: ${quoteYaml(dateStr)}`,
    `updated: ${quoteYaml(dateStr)}`,
    `category: ${quoteYaml(category)}`,
    "tags:",
    yamlList(tags, "  "),
    ...(questionSlug ? [`question: ${quoteYaml(questionSlug)}`] : []),
    "author:",
    `  name: ${quoteYaml(displayName)}`,
    `  graduationYear: ${quoteYaml(record["毕业届数"]?.trim() || "")}`,
    `  anonymous: ${isAnonymous}`,
    `  contactVisible: ${hasContact}`,
    "audience:",
    yamlList(["希望了解真实经验的高中生", "准备做升学或大学生活选择的读者"], "  "),
    "review:",
    `  status: ${quoteYaml(reviewStatus)}`,
    "display:",
    `  featured: ${isFeatured}`,
    "  showDisclaimer: true"
  ].join("\n");

  return {
    content: `---\n${frontmatter}\n---\n\n${body || "（正文待补充）"}\n`,
    id: record["投稿编号"],
    title,
    category,
    filename: buildFilename(record["投稿编号"], category, title),
    tags,
    reviewStatus
  };
}

// ── 类型检测 ────────────────────────────────────────────────────────

/**
 * 检测 CSV 表头是否为文章类型。
 */
export function detect(header) {
  return header.includes("投稿编号") ||
    header.includes("文章类型") ||
    header.includes("自由投稿正文");
}

// ── 处理单个 CSV ────────────────────────────────────────────────────

/**
 * 处理一个文章 CSV 文件：解析 → 生成 MD → 写入 → 归档。
 * @returns {{ totalWritten: number, summaries: Array }}
 */
export async function processCsv(csvPath, opts = {}) {
  const { dryRun = false, outDir = defaultOutDir } = opts;

  const csvRel = path.relative(rootDir, csvPath);
  const raw = await readFile(csvPath, "utf8");
  const { header, rows } = parseCSV(raw);

  if (header.length === 0) {
    console.warn(`⚠  Skipping "${csvRel}": empty or no header row.`);
    return { totalWritten: 0, summaries: [] };
  }

  console.log(`── ${csvRel} (${rows.length} row(s)) ──`);

  await mkdir(outDir, { recursive: true });

  const questionSlugMap = await buildQuestionTitleToSlugMap();

  let totalWritten = 0;
  let skippedCount = 0;
  const summaries = [];

  for (const row of rows) {
    const record = rowToRecord(header, row);
    const id = record["投稿编号"];
    if (!id) {
      console.warn("  ⚠  Skipping row without 投稿编号");
      continue;
    }

    // 只处理"拟通过"的行
    const reviewStatusRaw = (record["审核情况"] || "").trim();
    if (reviewStatusRaw !== "拟通过") {
      console.warn(`  ⏭  跳过 #${id}（审核情况: "${reviewStatusRaw || "（空）"}"）`);
      skippedCount++;
      continue;
    }

    const article = buildArticle(record, questionSlugMap);
    const outPath = path.join(outDir, article.filename);

    summaries.push({
      id,
      filename: article.filename,
      title: article.title,
      category: article.category,
      tags: article.tags,
      status: article.reviewStatus
    });

    if (dryRun) {
      console.log(`  [DRY RUN] → ${article.filename}`);
    } else {
      await writeFile(outPath, article.content, "utf8");
      console.log(`  ✓  ${article.filename}`);
    }

    totalWritten++;
  }

  // 归档
  if (!dryRun && rows.length > 0) {
    if (skippedCount === rows.length) {
      console.warn(`  ⚠  CSV 中所有行均被跳过，不归档，请检查审核情况。`);
    } else {
      const archivedRel = await archiveCsv(csvPath, archiveDir);
      console.log(`  → archived to ${archivedRel}`);
    }
  }

  console.log();
  return { totalWritten, summaries };
}

// ── 总结打印 ────────────────────────────────────────────────────────

export function printSummary(summaries, dryRun, outDir) {
  const lines = "=".repeat(60);
  console.log(lines);
  console.log(
    `${dryRun ? "[DRY RUN] Would write" : "Wrote"} ${summaries.length} article(s) → ${path.relative(rootDir, outDir)}/`
  );
  console.log(lines);
  console.log();

  for (const s of summaries) {
    console.log(`  #${s.id}  ${s.filename}`);
    console.log(`       标题    : ${s.title}`);
    console.log(`       分类    : ${s.category}`);
    console.log(`       标签    : ${s.tags.join(", ")}`);
    console.log(`       状态    : ${s.status}`);
    console.log();
  }
}

// ── 独立入口 ────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const { csvArg, dryRun, outDir } = parseCliArgs(args, defaultOutDir);
  const csvFiles = await collectCsvFiles(defaultCsvDir, csvArg);

  if (csvFiles.length === 0) {
    console.error("No CSV files found.");
    process.exit(1);
  }

  console.log(`Found ${csvFiles.length} CSV file(s):`);
  csvFiles.forEach((f) => console.log(`  - ${path.relative(rootDir, f)}`));
  console.log();

  const allSummaries = [];

  for (const csvPath of csvFiles) {
    const { summaries } = await processCsv(csvPath, { dryRun, outDir });
    allSummaries.push(...summaries);
  }

  printSummary(allSummaries, dryRun, outDir);
}

const isMain = process.argv[1]?.includes("csv-to-articles");
if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
