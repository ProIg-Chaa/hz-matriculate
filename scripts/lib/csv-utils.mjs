import { mkdir, readFile, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── 路径常量 ──────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// scripts/lib/ → scripts/ → 项目根
const rootDir = path.resolve(__dirname, "..", "..");
const defaultCsvDir = path.join(rootDir, "article", "csv");
const archiveDir = path.join(defaultCsvDir, "archived");

// ── CSV 解析 ──────────────────────────────────────────────────────────

/**
 * 手写 CSV 解析器，支持引号字段和字段内换行。
 * 返回 { header: string[], rows: string[][] }。
 */
export function parseCSV(raw) {
  // 去除 BOM、统一换行符
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

/**
 * 将 CSV 行数组转换为以表头为 key 的对象。
 */
export function rowToRecord(header, row) {
  const record = {};
  for (let i = 0; i < header.length; i++) {
    record[header[i]] = i < row.length ? row[i] : "";
  }
  return record;
}

// ── 字段转换 ──────────────────────────────────────────────────────────

/**
 * 解析日期字符串，支持以下格式：
 *   "2026.6.13" / "2026/06/20" → "2026-06-13"
 */
export function parseDate(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return new Date().toISOString().slice(0, 10);

  // "2026.6.13" or "2026.06.13"
  const dotParts = trimmed.split(".");
  if (dotParts.length === 3) {
    const [y, m, d] = dotParts;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // "2026/06/20"
  const slashParts = trimmed.split("/");
  if (slashParts.length === 3) {
    const [y, m, d] = slashParts;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) return date.toISOString().slice(0, 10);

  return new Date().toISOString().slice(0, 10);
}

/**
 * 解析逗号分隔的多值字段。
 *   "志愿填报, 专业选择" → ["志愿填报", "专业选择"]
 *   "志愿填报"            → ["志愿填报"]
 */
export function parseMultiValue(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.includes(", ")) {
    return trimmed.split(", ").map((s) => s.trim()).filter(Boolean);
  }
  if (trimmed.includes(",")) {
    return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [trimmed];
}

// ── 文本工具 ──────────────────────────────────────────────────────────

/**
 * 截断文本到指定长度，超出部分用 … 代替。
 */
export function clipText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

/**
 * 取文本的第一句话（以 。！？!? 或换行结束）。
 */
export function firstSentence(text) {
  const match = text.match(/^([^。！？!?\n]+)/);
  return (match ? match[1] : text).trim();
}

// ── YAML 工具 ─────────────────────────────────────────────────────────

/**
 * 为 YAML 字符串值添加引号和转义。
 */
export function quoteYaml(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * 将字符串数组渲染为 YAML 列表格式。
 */
export function yamlList(values, indent = "") {
  if (!values || values.length === 0) return `${indent}[]`;
  return values.map((v) => `${indent}- ${quoteYaml(v)}`).join("\n");
}

/**
 * 去重并过滤空值。
 */
export function uniqueValues(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

// ── 文件工具 ──────────────────────────────────────────────────────────

export async function exists(filePath) {
  try {
    await readFile(filePath, "utf8");
    return true;
  } catch (e) {
    if (e?.code === "ENOENT") return false;
    throw e;
  }
}

/**
 * 收集 CSV 文件列表。若指定了 csvArg 则只返回该文件，否则扫描 csvDir。
 */
export async function collectCsvFiles(csvDir, csvArg) {
  if (csvArg) return [path.resolve(csvArg)];

  try {
    const { readdir: ls } = await import("node:fs/promises");
    const entries = await ls(csvDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(".csv"))
      .map((e) => path.join(csvDir, e.name))
      .sort();
  } catch {
    console.error(`No CSV directory found at ${path.relative(rootDir, csvDir)}/`);
    console.error("Create it and drop your CSV files there, or pass a CSV path directly.");
    process.exit(1);
  }
}

/**
 * 将处理完的 CSV 移动到归档目录。
 */
export async function archiveCsv(filePath, archiveDirPath) {
  await mkdir(archiveDirPath, { recursive: true });

  const base = path.basename(filePath);
  let dest = path.join(archiveDirPath, base);

  if (await exists(dest)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const ext = path.extname(base);
    const stem = path.basename(base, ext);
    dest = path.join(archiveDirPath, `${stem}-${stamp}${ext}`);
  }

  await rename(filePath, dest);
  return path.relative(rootDir, dest);
}

// ── CLI ────────────────────────────────────────────────────────────────

/**
 * 解析命令行参数，返回 { csvArg, dryRun, outDir }。
 */
export function parseCliArgs(args, defaultOutDir) {
  const csvArg = args.find((a) => a.endsWith(".csv"));
  const dryRun = args.includes("--dry-run");
  const outDirIndex = args.indexOf("--out-dir");
  const outDir = path.resolve(
    outDirIndex !== -1 ? args[outDirIndex + 1] : defaultOutDir
  );
  return { csvArg, dryRun, outDir };
}

// ── 常量导出 ──────────────────────────────────────────────────────────

export { rootDir, defaultCsvDir, archiveDir };
