# 2026-06-13 Article Likes

## Background

The site is static, so article likes need a small writable service outside Astro. The goal for this iteration is to add the lightest stable path without adding login, comments, or a database-backed application server.

## Changes

- Added an article detail like panel that can read and submit likes through `PUBLIC_LIKE_API_URL`.
- Used `localStorage` to prevent repeat likes from the same browser.
- Added a Cloudflare Worker reference implementation at `workers/likes-worker.mjs`.
- Added the `PUBLIC_LIKE_API_URL` environment variable placeholder.

## Boundaries

- Likes are only shown on article detail pages.
- The static site still builds and works when no like API is configured; the like panel shows a disabled state.
- The Worker uses a KV binding named `LIKES`. This is intentionally minimal and does not provide account-level identity or strict global anti-spam guarantees.

## Validation

- Build validation should confirm Astro, sitemap, and Pagefind still complete successfully.
- Manual validation should check article pages with and without `PUBLIC_LIKE_API_URL`.
