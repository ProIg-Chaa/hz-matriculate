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
  const text = raw.replace(/^﻿/, "").replace(/\r\n/g, "\n").trim();
  const lines = text.split("\n");
  if (lines.length < 2) return { header: [], rows: [] };

  const header = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    rows.push(parseCSVLine(line));
  }
  return { header, rows };
}

function parseCSVLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        // 可能是引号字段的结束，或者是转义后的引号 ""
        if (line[i + 1] === '"') {
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
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
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

function inferDescription(body) {
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

// ── 构建文章 ─────────────────────────────────────────────────

function buildArticle(record) {
  const tags = [
    ...parseMultiValue(record["文章类型"] || ""),
    ...parseMultiValue(record["其他类型"] || ""),
    record["选科组合"] ? record["选科组合"].trim() : null
  ].filter(Boolean);

  const body = (record["自由投稿正文"] || "").trim();
  const category = inferCategory(tags, body);
  const title = inferTitle(body);
  const description = inferDescription(body);
  const dateStr = record["投稿时间"] ? parseDate(record["投稿时间"]) : new Date().toISOString().slice(0, 10);
  const isAnonymous = record["是否匿名"] === "是";
  const displayName = record["展示昵称"]?.trim() || "匿名校友";
  const hasContact = !!(record["联系方式"]?.trim());
  const hasQuestion = record["是否关联问题"] === "是" && record["关联问题"]?.trim() && record["关联问题"] !== "无";

  const reviewStatusMap = {
    "审核中": "submitted",
    "已通过": "published",
    "已发布": "published",
    "草稿": "draft",
    "退回": "draft"
  };
  const reviewStatus = reviewStatusMap[record["审核情况"]?.trim()] || "submitted";

  const frontmatter = [
    `title: ${quoteYaml(title)}`,
    `description: ${quoteYaml(description)}`,
    `date: ${quoteYaml(dateStr)}`,
    `updated: ${quoteYaml(dateStr)}`,
    `category: ${quoteYaml(category)}`,
    "tags:",
    yamlList(tags, "  "),
    ...(hasQuestion ? [`question: ${quoteYaml(record["关联问题"].trim())}`] : []),
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
    "  featured: false",
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

    for (const row of rows) {
      const record = rowToRecord(header, row);
      const id = record["投稿编号"];
      if (!id) {
        console.warn("  ⚠  Skipping row without 投稿编号");
        continue;
      }

      const article = buildArticle(record);
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
      const archivedRel = await archiveCsv(csvPath);
      console.log(`  → archived to ${archivedRel}`);
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
