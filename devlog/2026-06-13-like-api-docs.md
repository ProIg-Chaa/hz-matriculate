# 2026-06-13 Like API Docs

## Background

During live configuration, the like API exposed several deployment details that are easy to miss: Workers default domains can be unreliable in some networks, Astro public variables are injected at build time, and CORS must match the exact page origin.

## Changes

- Added `doc/like-api-setup.md` with the full setup flow for Worker, KV, custom domain, CORS, GitHub Actions variables, HTTPS, and troubleshooting.
- Added a README pointer to the dedicated like API setup document.
- Recorded checks for `data-like-endpoint`, `PUBLIC_LIKE_API_URL`, and `ALLOWED_ORIGIN`.

## Notes

- The recommended API URL is `https://likes.jihuway.org` instead of the Worker default `*.workers.dev` domain.
- GitHub Pages must be redeployed after changing `PUBLIC_LIKE_API_URL`.
- `http://jihuway.org` and `https://jihuway.org` are different browser origins; the site should force HTTPS.
