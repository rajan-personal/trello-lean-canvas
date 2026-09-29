# Email login UI proof

Updated after the minimal-UI review of PR #25. Captured from built Storybook with synthetic `alex@example.test` data and mocked authentication callbacks. No production account or Google credentials are used.

| Image | UI state |
| --- | --- |
| `sign-in-desktop.png` | Compact Google and email/password sign-in at 1440 × 900 |
| `sign-in-mobile.png` | Sign-in at 390 × 844 |
| `account-menu-desktop.png` | Account email expanded in the workspace sidebar |
| `account-menu-mobile.png` | Account menu above its trigger on mobile; no sidebar clipping |
| `set-password.png` | Password setup inside the workspace |
| `set-password-mobile.png` | Password setup at 390 × 844 |
| `change-password.png` | Existing password change |
| `password-saved.png` | Successful password save confirmation |

The earlier signup-tab screenshot was removed: one Google button handles both Google signup and sign-in. Password help is available on demand, and account actions stay inside the expandable email menu.

Reproduce with `npm run build-storybook`, serve `storybook-static`, and open its `iframe.html?id=…&viewMode=story` routes:

- `screens-login--default`
- `screens-workspace-account--desktop` (expand the account email; on mobile open the sidebar first)
- `screens-workspace-account--with-password` (expand the email and choose Change password)

Validation: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run build-storybook`, and all 115 unit tests pass. The focused browser suite passes 38 stories across 12 affected files. Coverage includes account-menu arrows/Home/End, Tab/outside/Escape dismissal, focus restoration, pending-signout Escape, menu bounds, sign-out failure/retry, optional recovery help, and password save flows. Workspace stories run with one worker because their existing localStorage fixtures share keys.

The sandbox's default Playwright browser download was unavailable; browser checks ran with an npm-packaged Chromium executable through a temporary local Vitest launch override. Dependencies were restored with `npm ci` before tests. The override and browser package are not part of the change.

Production OAuth/provider deployment still needs the release smoke test in [email sign-in setup](../../email-sign-in.md).
