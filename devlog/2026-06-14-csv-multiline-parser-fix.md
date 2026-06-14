# 2026-06-14 CSV Multiline Parser Fix

## Background

The CSV conversion script incorrectly split records by newline before parsing fields. When a submission body contained multiline text inside a quoted CSV field, each body line was treated as a separate article.

## Changes

- Reworked `scripts/csv-to-md.mjs` CSV parsing to scan character by character.
- Preserved newlines inside quoted fields.
- Continued to support escaped quotes with `""`.
- Kept the existing field mapping and output strategy unchanged.

## Validation

- Ran `npm run csv:preview` against the current CSV in `article/csv/`.
- The file is now parsed as 2 rows instead of 42 fragmented rows.
- Confirmed expected dry-run output:
  - `10-university-life-university-life.md`
  - `11-major-review-volunteer-application.md`
