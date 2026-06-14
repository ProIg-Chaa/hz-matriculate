# 2026-06-14 CSV Public Info Tags

## Background

CSV submissions include an explicit field for whether rank, university, and major may be displayed. When that field allows display, those values should also be available as tags for filtering and discovery.

## Changes

- Added public rank, university, and major values to generated tags when `是否展示位次，院校与专业` is `是`.
- Split `选科组合` by comma so each subject becomes an independent tag.
- Updated the current generated CSV articles to include the new tags.

## Validation

- Ran CSV dry-run against the archived source CSV.
- Confirmed generated tags include examples such as `>50000`, `广州大学`, `光电信息科学与工程`, `<1000`, `北京大学`, and `阿拉伯语`.
