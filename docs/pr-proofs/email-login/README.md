# Email login UI proof

Captured from the built Storybook with synthetic `alex@example.test` data and mocked authentication callbacks. No production account or Google credentials are used.

| Image | UI state |
| --- | --- |
| `sign-in-desktop.png` | Google and email/password sign-in at 1440 × 900 |
| `sign-in-mobile.png` | Responsive sign-in at 390 × 844 |
| `google-only-signup.png` | Signup offers only Google |
| `set-password.png` | First password setup |
| `set-password-mobile.png` | Password setup at 390 × 844; dialog stays inside viewport |
| `change-password.png` | Existing password change |
| `password-saved.png` | Successful password save confirmation |

Reproduce with `npm run build-storybook`, serve `storybook-static`, and open its `iframe.html?id=…&viewMode=story` routes:

- `screens-login--default` (use Sign up for signup state)
- `screens-password-settings--set-password`
- `screens-password-settings--change-password` (submit matching passwords for success)

Validation: `npm run typecheck`, `npm run lint`, `npm run build`, and all 115 unit tests pass. The focused browser suite passes 21 stories across LoginScreen, PasswordDialog, AppSession, AccountButton, FeedbackInteractions, and AccountPassword. It covers email submission, Google-only signup, confirmation mismatch, verification cancellation, pending state, password save, and Set → Change with focus restoration.

The sandbox's default Playwright browser download was unavailable; browser checks ran with an npm-packaged Chromium executable through a temporary local Vitest launch override. Dependencies were restored with `npm ci` before tests. The override and browser package are not part of the change.

Production OAuth/provider deployment still needs the release smoke test in [email sign-in setup](../../email-sign-in.md).
