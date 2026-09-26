# Task comment preview evidence

- Preview: https://box-node-3b67fba47dc69dba-4173.on.boat.dev
- Boat sandbox: `bx_8a627399`; scheduled to stop **2026-09-27 08:53 UTC**.
- Synthetic task, synthetic initial agent comment, browser-local user comments. No production data, credentials, Firebase rule deployments, or real agent identities.
- [Desktop](desktop.png) and [mobile](mobile.png) show the refined two-panel layout, avatar-based thread, and reply composer, captured against the public HTTPS URL from Chromium running inside Boat.

The hosted smoke check posted a user reply, reloaded the task deep link, checked both author labels and persistence, checked the preview's Tailwind styles, and reported no browser page errors.

```bash
COMMENTS_PREVIEW_URL=https://box-node-3b67fba47dc69dba-4173.on.boat.dev \
  node scripts/verify-comments-preview.mjs
```

Other validation ran remotely on the same sandbox: lint, TypeScript, unit tests, Firestore emulator tests (including actual REST and Node CLI execution), the complete standard Playwright suite, comment Storybook interaction/accessibility tests, production and isolated-preview builds, and React Doctor. Design follow-up: **116 browser tests, 90 unit tests, and 63 board Storybook interaction/accessibility checks passed**. New regressions cover Ctrl/Command+Enter, IME composition, multiline text, and long authors/statuses/URLs at 320, 760, and 1440 pixels. See the PR for the remaining validation.
