import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  rootDir, defaultCsvDir, archiveDir,
  parseCSV, rowToRecord,
  parseDate, parseMultiValue,
  clipText, firstSentence,
  quoteYaml, yamlList,
  collectCsvFiles, archiveCsv,
  parseCliArgs
} from "./lib/csv-utils.mjs";

// ── Config ──────────────────────────────────────────────────────────

const defaultOutDir = path.join(rootDir, "src", "content", "questions");

// ── 构建问题 ────────────────────────────────────────────────────────

/**
 * 从 CSV 记录构建问题 MD 的 frontmatter 和正文。
 */
function buildQuestion(record) {
  const title = (record["问题标题"] || "").trim();
  if (!title) {
    throw new Error(`缺少问题标题（自动编号: ${record["自动编号"] || "未知"}）`);
  }

  // 描述：优先取「问题描述」，为空则用正文首句，再为空则用标题
  let description = (record["问题描述"] || "").trim();
  if (!description) {
    const body = (record["问题正文"] || "").trim();
    if (body) {
      description = clipText(firstSentence(body) || body, 110);
    }
  }
  if (!description) {
    description = title;
  }

  const dateStr = parseDate(record["提交时间"] || "");
  const tags = parseMultiValue(record["问题标签"] || "");
  const role = (record["身份"] || "提问者").trim();
  const askerName = `匿名${role}`;

  const body = (record["问题正文"] || "").trim()
    .replace(/\n/g, "\n\n")
    .replace(/\n{3,}/g, "\n\n");

  const frontmatter = [
    `title: ${quoteYaml(title)}`,
    `description: ${quoteYaml(description)}`,
    `date: ${quoteYaml(dateStr)}`,
    `updated: ${quoteYaml(dateStr)}`,
    "tags:",
    yamlList(tags, "  "),
    "asker:",
    `  name: ${quoteYaml(askerName)}`,
    `  role: ${quoteYaml(role)}`,
    "  anonymous: true",
    "display:",
    "  featured: false"
  ].join("\n");

  return {
    content: `---\n${frontmatter}\n---\n\n${body || "（问题正文待补充）"}\n`,
    id: record["自动编号"],
    title,
    slug: (record["自动编号"] || "").trim(),
    tags,
    role
  };
}

// ── 类型检测 ────────────────────────────────────────────────────────

/**
 * 检测 CSV 表头是否为问题类型。
 */
export function detect(header) {
  return header.includes("问题标题") ||
    header.includes("问题标签") ||
    header.includes("自动编号");
}

// ── 处理单个 CSV ────────────────────────────────────────────────────

/**
 * 处理一个问题 CSV 文件：解析 → 生成 MD → 写入 → 归档。
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

  let totalWritten = 0;
  let skippedCount = 0;
  const summaries = [];

  for (const row of rows) {
    const record = rowToRecord(header, row);
    const id = record["自动编号"];
    if (!id) {
      console.warn("  ⚠  Skipping row without 自动编号");
      continue;
    }

    // 只处理"待发布"的行
    const reviewStatusRaw = (record["审核情况"] || "").trim();
    if (reviewStatusRaw !== "待发布") {
      console.warn(`  ⏭  跳过 #${id}（审核情况: "${reviewStatusRaw || "（空）"}"）`);
      skippedCount++;
      continue;
    }

    const question = buildQuestion(record);
    const outPath = path.join(outDir, `${question.slug}.md`);

    summaries.push({
      id,
      filename: `${question.slug}.md`,
      title: question.title,
      tags: question.tags,
      role: question.role
    });

    if (dryRun) {
      console.log(`  [DRY RUN] → ${question.slug}.md`);
    } else {
      await writeFile(outPath, question.content, "utf8");
      console.log(`  ✓  ${question.slug}.md`);
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
    `${dryRun ? "[DRY RUN] Would write" : "Wrote"} ${summaries.length} question(s) → ${path.relative(rootDir, outDir)}/`
  );
  console.log(lines);
  console.log();

  for (const s of summaries) {
    console.log(`  #${s.id}  ${s.filename}`);
    console.log(`       标题    : ${s.title}`);
    console.log(`       标签    : ${s.tags.join(", ")}`);
    console.log(`       提问身份 : ${s.role}`);
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

const isMain = process.argv[1]?.includes("csv-to-questions");
if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
