# 2026-06-14 CSV Expanded Tags

## Background

The CSV source contains more structured fields than the initial tag mapping used. Several fields are useful for discovery and filtering, as long as they do not expose hidden private information.

## Changes

- Added graduation year tags such as `2024届`.
- Added compact subject-combination tags such as `物化生` and `史地政`, while keeping individual subject tags.
- Continued to add rank, university, and major only when `是否展示位次，院校与专业` is `是`.
- Extracted stable body-template values for tags:
  - `当前年级/状态`
  - `本次分享重点`
- Treated body-template tag extraction as optional. Free-form submissions without these template lines are left unchanged.
- Updated the two generated CSV articles with the expanded tags.

## Validation

- Ran the CSV dry-run against the archived source CSV.
- Confirmed row 10 includes tags such as `2024届`, `物化生`, `大二在读`, and `光电专业真实情况分享`.
- Confirmed row 11 includes tags such as `2024届`, `史地政`, `<1000`, `北京大学`, and `阿拉伯语`.
