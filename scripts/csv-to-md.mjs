import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── Config ──────────────────────────────────────────────────────────

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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

const allCategories = Object.keys(categorySlugs);

// 根据标签和正文关键词推断分类的提示词列表
const categoryHints = {
  "志愿填报": ["志愿", "填报", "录取", "分数线", "排位", "提前批", "普通批"],
  "大学生活": ["大学生活", "大学", "宿舍", "社团", "作息", "早八", "舍友"],
  "专业体验": ["专业", "课程", "实验", "编程", "论文", "就读"],
  "高考备考": ["高考", "备考", "复习", "考试", "心态"],
  "发展路径": ["保研", "考研", "就业", "实习", "转专业", "留学", "考公", "出国"]
};

// 从问题 MD 文件构建标题→slug 映射
async function buildQuestionTitleToSlugMap() {
  const questionsDir = path.join(rootDir, "src", "content", "questions");
  const map = new Map();

  try {
    const { readdir: ls } = await import("node:fs/promises");
    const entries = await ls(questionsDir, { withFileTypes: true });
    const mdFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".md"));

    for (const file of mdFiles) {
      const content = await readFile(path.join(questionsDir, file.name), "utf8");
      // 从 frontmatter 中提取 title 字段
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

// ── CLI ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const csvArg = args.find((a) => a.endsWith(".csv"));
const dryRun = args.includes("--dry-run");
const outDirIndex = args.indexOf("--out-dir");
const outDir = path.resolve(
  outDirIndex !== -1 ? args[outDirIndex + 1] : defaultOutDir
);
const defaultCsvDir = path.join(rootDir, "article", "csv");
const archiveDir = path.join(defaultCsvDir, "archived");

// ── CSV 解析 ──────────────────────────────────────────────────────

function parseCSV(raw) {
  // 去除可能的 BOM 和多余空行，统一换行符
  const text = raw.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!text) return { header: [], rows: [] };

  const records = [];
  let record = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        // 可能是引号字段的结束，或者是转义后的引号 ""
        if (text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        record.push(current.trim());
        current = "";
      } else if (ch === "\n") {
        record.push(current.trim());
        current = "";
        if (record.some((field) => field !== "")) {
          records.push(record);
        }
        record = [];
      } else {
        current += ch;
      }
    }
  }

  record.push(current.trim());
  if (record.some((field) => field !== "")) {
    records.push(record);
  }

  if (records.length < 2) return { header: records[0] || [], rows: [] };

  const [header, ...rows] = records;
  return { header, rows };
}

function rowToRecord(header, row) {
  const record = {};
  for (let i = 0; i < header.length; i++) {
    record[header[i]] = i < row.length ? row[i] : "";
  }
  return record;
}

// ── 字段转换 ────────────────────────────────────────────────

function parseDate(raw) {
  // "2026.6.13" → "2026-06-13"
  const parts = raw.trim().split(".");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // fallback: try ISO
  const date = new Date(raw);
  if (!isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

function parseMultiValue(raw) {
  // Single value: 专业前景与就业
  // Multi-value: "留学考公, 各种决策纠结, 其他" → split by ", "
  const trimmed = raw.trim();
  if (!trimmed) return [];
    // 如果它来自一个带引号的 CSV 字段，那么它已经被解包了
    // 以逗号和空格（","）作为分隔符
  if (trimmed.includes(", ")) {
    return trimmed.split(", ").map((s) => s.trim()).filter(Boolean);
  }
  // 同时处理不带空格的逗号
  if (trimmed.includes(",")) {
    return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [trimmed];
}

// ── 推断标题和描述 ───────────────────────────────────────────────────────

function clipText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function firstSentence(text) {
  const match = text.match(/^([^。！？!?\n]+)/);
  return (match ? match[1] : text).trim();
}

function inferTitle(body) {
  const sentence = firstSentence(body);
  return clipText(sentence || "未命名投稿", 28);
}

// ── Description inference helpers ──────────────────────────────────

function extractSummaryLine(body) {
  // 从模板"一句话总结"区块提取最终总结内容
  const lines = body.split("\n");
  let inSummary = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // 匹配章节标题："五、一句话总结（必填...）" 等
    if (/^[一二三四五六七八九十\d]+[、.．]\s*一句话总结/.test(trimmed)) {
      inSummary = true;
      continue;
    }

    if (!inSummary) continue;

    // 离开总结区块：遇到下一个大章节标题
    if (/^[一二三四五六七八九十\d]+[、.．]/.test(trimmed) && trimmed.length > 4) {
      break;
    }

    // 跳过空行
    if (!trimmed) continue;
    // 跳过引导短句（如 "对未来想走这条路的学弟学妹说一句话："）
    if (trimmed.length < 8) continue;
    if (/^(对|想|请|说|给)/.test(trimmed) && trimmed.length < 35) continue;

    // 找到了 — 这就是一句话总结的正文
    return trimmed;
  }

  return null;
}

function isMetadataLine(line) {
  // 跳过模板章节标题行
  if (/^[一二三四五六七八九十\d]+[、.．]\s*(我的|这条|我为什么|踩过|对应|一句话|本次)/.test(line)) {
    return true;
  }

  // 跳过以"个人信息："或"基本情况："开头的纯元数据行
  if (/^(个人信息|基本情况|投稿编号|填报工具)[：:]/.test(line)) return true;

  // 高密度分隔符（/ — ： |），暗示是 key-value 拼接的元数据行
  const sepCount = (line.match(/[\/—：:｜]/g) || []).length;
  if (sepCount >= 3 && line.length < 150) return true;

  return false;
}

function inferDescription(body) {
  // Tier 1: 模板"一句话总结" — 最精准
  const summary = extractSummaryLine(body);
  if (summary) return clipText(summary, 110);

  // Tier 2: 跳过开头的元数据行，取第一个实质性段落
  const lines = body.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (isMetadataLine(trimmed)) continue;
    // 太短的不像正文段落（< 15 字）
    if (trimmed.length < 15) continue;
    return clipText(trimmed, 110);
  }

  // Tier 3: 兜底 — 当前行为（全文化平取前 110 字）
  const plain = body.replace(/[#>*_`[\]()\n\r]/g, "").replace(/\s+/g, " ").trim();
  return clipText(plain || "暂无描述", 110);
}

function inferCategory(tags, body) {
  // 优先根据标签直接匹配分类关键词
  for (const tag of tags) {
    for (const [category, keywords] of Object.entries(categoryHints)) {
      if (keywords.some((kw) => tag.includes(kw))) {
        return category;
      }
    }
  }

  // 分析正文关键词得分
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

// ── 文件名 ────────────────────────────────────────────────────────

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

// ── YAML ────────────────────────────────────────────────────

function quoteYaml(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function yamlList(values, indent = "") {
  if (!values || values.length === 0) return `${indent}[]`;
  return values.map((v) => `${indent}- ${quoteYaml(v)}`).join("\n");
}

function uniqueValues(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
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
  // Not every submission uses the template. These tags are optional enhancements only.
  return uniqueValues([
    extractBodyField(body, "当前年级/状态"),
    extractBodyField(body, "本次分享重点")
  ]);
}

// ── 构建文章 ─────────────────────────────────────────────────

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
    .replace(/\n/g, "\n\n")      // CSV 单元格中的单换行 → Markdown 段落分隔
    .replace(/\n{3,}/g, "\n\n"); // 避免产生过多空行

  // 将问题标题解析为 slug（需在 category 之前）
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
    content: `---\n${frontmatter}\n---\n\n${body ? body : "（正文待补充）"}\n`,
    id: record["投稿编号"],
    title,
    category,
    filename: buildFilename(record["投稿编号"], category, title),
    tags,
    reviewStatus
  };
}

// ───────────────────────────────────────────────────────────

async function collectCsvFiles() {
  if (csvArg) return [path.resolve(csvArg)];

  try {
    const { readdir: ls } = await import("node:fs/promises");
    const entries = await ls(defaultCsvDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(".csv"))
      .map((e) => path.join(defaultCsvDir, e.name))
      .sort();
  } catch {
    console.error(`No CSV directory found at ${path.relative(rootDir, defaultCsvDir)}/`);
    console.error("Create it and drop your CSV files there, or pass a CSV path directly.");
    process.exit(1);
  }
}

async function archiveCsv(filePath) {
  await mkdir(archiveDir, { recursive: true });

  const base = path.basename(filePath);
  let dest = path.join(archiveDir, base);

  // 如果目标文件已存在，添加时间戳避免覆盖
  if (await exists(dest)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const ext = path.extname(base);
    const stem = path.basename(base, ext);
    dest = path.join(archiveDir, `${stem}-${stamp}${ext}`);
  }

  await rename(filePath, dest);
  return path.relative(rootDir, dest);
}

async function exists(filePath) {
  try {
    await readFile(filePath, "utf8");
    return true;
  } catch (e) {
    if (e?.code === "ENOENT") return false;
    throw e;
  }
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const csvFiles = await collectCsvFiles();

  if (csvFiles.length === 0) {
    console.error("No CSV files found.");
    process.exit(1);
  }

  console.log(`Found ${csvFiles.length} CSV file(s):`);
  csvFiles.forEach((f) => console.log(`  - ${path.relative(rootDir, f)}`));
  console.log();

  await mkdir(outDir, { recursive: true });

  const questionSlugMap = await buildQuestionTitleToSlugMap();

  let totalWritten = 0;
  const allSummaries = [];

  for (const csvPath of csvFiles) {
    const csvRel = path.relative(rootDir, csvPath);
    const raw = await readFile(csvPath, "utf8");
    const { header, rows } = parseCSV(raw);

    if (header.length === 0) {
      console.warn(`⚠  Skipping "${csvRel}": empty or no header row.`);
      continue;
    }

    console.log(`── ${csvRel} (${rows.length} row(s)) ──`);

    let skippedCount = 0;

    for (const row of rows) {
      const record = rowToRecord(header, row);
      const id = record["投稿编号"];
      if (!id) {
        console.warn("  ⚠  Skipping row without 投稿编号");
        continue;
      }

      // 只处理审核情况为"拟通过"的行，避免未经最终确认的内容进入发布目录。
      const reviewStatusRaw = (record["审核情况"] || "").trim();
      if (reviewStatusRaw !== "拟通过") {
        console.warn(`  ⏭  跳过 #${id}（审核情况: "${reviewStatusRaw || "（空）"}"）`);
        skippedCount++;
        continue;
      }

      const article = buildArticle(record, questionSlugMap);
      const outPath = path.join(outDir, article.filename);

      allSummaries.push({
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

    // 处理完当前 CSV 后再归档，避免在写入过程中移动文件导致读取失败
    if (!dryRun && rows.length > 0) {
      if (skippedCount === rows.length) {
        console.warn(`  ⚠  CSV 中所有行均被跳过，不归档，请检查审核情况。`);
      } else {
        const archivedRel = await archiveCsv(csvPath);
        console.log(`  → archived to ${archivedRel}`);
      }
    }

    console.log();
  }

  // ── 总结 ───────────────────────────────────────────────────────
  const lines = "=".repeat(60);
  console.log(lines);
  console.log(
    `${dryRun ? "[DRY RUN] Would write" : "Wrote"} ${totalWritten} file(s) → ${path.relative(rootDir, outDir)}/`
  );
  console.log(lines);
  console.log();

  for (const s of allSummaries) {
    console.log(`  #${s.id}  ${s.filename}`);
    console.log(`       标题    : ${s.title}`);
    console.log(`       分类    : ${s.category}`);
    console.log(`       标签    : ${s.tags.join(", ")}`);
    console.log(`       状态    : ${s.status}`);
    console.log();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
