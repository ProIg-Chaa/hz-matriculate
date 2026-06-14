# 2026-06-14 Submission ID Corner

## Background

CSV submissions have stable numeric IDs. Showing the ID quietly on article detail pages helps maintainers map a published article back to the original CSV record.

## Changes

- Added optional `source.submissionId` to the Article content schema.
- Updated the CSV conversion script to write `source.submissionId` from `投稿编号`.
- Added a subtle fixed corner marker on article detail pages when `source.submissionId` exists.
- Added source IDs to the two current CSV-generated articles.
- Aligned the current CSV-generated article filenames and corner IDs with `article/csv/archived/2.csv`, using IDs such as `HZ20260614010`.

## Validation

- The marker is optional and does not affect existing non-CSV articles.
- Build validation should confirm the updated content schema and article pages still compile.
