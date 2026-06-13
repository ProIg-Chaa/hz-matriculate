# 2026-06-13 Feature Real Articles

## Background

The site now has multiple real submitted articles. The home page featured section should prioritize real content instead of sample content, and all real articles marked as featured should be visible.

## Changes

- Removed the home page featured article limit so every article with `display.featured: true` can appear in the featured section.
- Kept the current real articles in the featured pool.
- Moved sample articles out of the featured pool by setting their `display.featured` value to `false`.

## Validation

- Confirmed the change is limited to featured display behavior and sample article metadata.
- Build validation should be run before committing or deployment.
