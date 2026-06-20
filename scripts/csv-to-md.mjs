/**
 * csv-to-md — CSV → Markdown 自动识别入口。
 *
 * 用法:
 *   node scripts/csv-to-md.mjs [csv-file.csv] [--dry-run]
 *
 * 自动检测 CSV 类型：
 *   - 含「问题标题」/「自动编号」→ 问题 → 调用 csv-to-questions
 *   - 含「投稿编号」/「自由投稿正文」→ 文章 → 调用 csv-to-articles
 *
 * 也可以直接调用子脚本：
 *   node scripts/csv-to-articles.mjs ...
 *   node scripts/csv-to-questions.mjs ...
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  rootDir, defaultCsvDir,
  parseCSV,
  collectCsvFiles,
  parseCliArgs
} from "./lib/csv-utils.mjs";

// ── 类型检测 ────────────────────────────────────────────────────────

/**
 * 根据 CSV 表头判断类型。
 * @returns {"article" | "question" | "unknown"}
 */
function detectType(header) {
  // 问题特征列
  if (header.includes("问题标题") || header.includes("问题标签") || header.includes("自动编号")) {
    return "question";
  }
  // 文章特征列
  if (header.includes("投稿编号") || header.includes("文章类型") || header.includes("自由投稿正文")) {
    return "article";
  }
  return "unknown";
}

// ── 读取表头（只读第一行前几 KB） ──────────────────────────────────

async function readHeader(csvPath) {
  // CSV 表头很短，读 4 KB 足够
  const fd = await readFile(csvPath, "utf8");
  // 找到第一个换行后的引号字段可能跨行，但表头通常在第一行
  // 使用 parseCSV 取 header
  const { header } = parseCSV(fd.slice(0, 4096));
  return header;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const { csvArg, dryRun } = parseCliArgs(args, ""); // outDir 由子脚本决定

  const csvFiles = await collectCsvFiles(defaultCsvDir, csvArg);

  if (csvFiles.length === 0) {
    console.error("No CSV files found.");
    process.exit(1);
  }

  console.log(`Found ${csvFiles.length} CSV file(s):`);
  csvFiles.forEach((f) => console.log(`  - ${path.relative(rootDir, f)}`));
  console.log();

  const allArticleSummaries = [];
  const allQuestionSummaries = [];

  for (const csvPath of csvFiles) {
    const csvRel = path.relative(rootDir, csvPath);
    const header = await readHeader(csvPath);
    const type = detectType(header);

    console.log(`── ${csvRel} → 检测为 ${type === "question" ? "问题" : type === "article" ? "文章" : "未知"} ──`);

    if (type === "article") {
      const { processCsv, printSummary } = await import("./csv-to-articles.mjs");
      const { summaries } = await processCsv(csvPath, { dryRun });
      allArticleSummaries.push(...summaries);
      if (summaries.length > 0) {
        printSummary(summaries, dryRun, path.join(rootDir, "src", "content", "articles"));
      }
    } else if (type === "question") {
      const { processCsv, printSummary } = await import("./csv-to-questions.mjs");
      const { summaries } = await processCsv(csvPath, { dryRun });
      allQuestionSummaries.push(...summaries);
      if (summaries.length > 0) {
        printSummary(summaries, dryRun, path.join(rootDir, "src", "content", "questions"));
      }
    } else {
      console.error(`  ✗ 无法识别的 CSV 格式，表头: [${header.join(", ")}]`);
      console.error("    请确认该 CSV 是文章收集表或问题收集表。");
      console.error("    也可以直接运行对应子脚本：");
      console.error("      node scripts/csv-to-articles.mjs <csv>");
      console.error("      node scripts/csv-to-questions.mjs <csv>");
    }

    console.log();
  }

  // 汇总
  const totalArticle = allArticleSummaries.length;
  const totalQuestion = allQuestionSummaries.length;

  if (totalArticle + totalQuestion > 0) {
    const lines = "=".repeat(60);
    console.log(lines);
    console.log(
      `${dryRun ? "[DRY RUN] Would write" : "Wrote"} ${totalArticle} article(s) + ${totalQuestion} question(s)`
    );
    console.log(lines);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
