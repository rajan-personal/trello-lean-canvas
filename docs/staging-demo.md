# Isolated design-stack staging demo

This frontend demo uses the complete issues #32–56 / PRs #57–81 stack at
`8e9b875cff710f7df2ba069361f33ca6324970a0`. PR #29 is excluded.
It uses the real Workspace UI and existing local persistence repositories.

The dedicated Worker is `lean-design-stack-staging-20261002`:
https://lean-design-stack-staging-20261002.bittu15388.workers.dev

## Try the demo

Open the URL; no credentials are needed. `demo@example.test` is a synthetic
display identity, not an account or password. Two synthetic projects and a
sample ticket board appear automatically. Try Tickets, Canvas, About, Notepad,
All tickets, YAML import/export, card editing, comments and status changes.
Edits survive refresh in the same browser. **Reset demo** clears only this
staging origin's `lean-canvas:` storage and restores the samples. The account
menu's Sign out action also resets this local demo.

Each browser has independent data. There is no shared database, login,
password setup, real account session, cloud sync or cross-device persistence.
Those flows are not validated by this demo. The staging banner uses 40px of
viewport height. No service worker is installed.

## Isolation and deployment

`vite.staging.config.ts` builds a separate entry point and `dist-staging`.
Its build guard rejects Firebase SDK modules, production Firebase configuration
and AuthProvider. Firebase imports in local repositories resolve to fail-closed
placeholders; all remote operations throw. The existing loopback-only test
auth bypass is unchanged and is not used for staging.

Static asset headers restrict API connections to the staging origin and mark
the demo noindex. The only external resources allowed are the existing Google
Fonts stylesheet/font files. `wrangler.staging.jsonc` has no production routes,
custom domains, cron, database, service bindings or secrets. The production
Wrangler config and Firebase project/rules/authorized domains remain untouched.

Use Node >=22.12 and npm >=11.17 with the existing lockfile:

```sh
npm run lint
npm run typecheck
npm test
npm run build:staging
npx wrangler deploy --config wrangler.staging.jsonc --dry-run
# Requires existing authorized Cloudflare deployment credentials:
npm run deploy:staging
```

To run the demo checks locally, serve the staging build with
`npx wrangler dev --config wrangler.staging.jsonc --local --port 4174`, then
`npm run verify:staging`. The verifier uses `/usr/bin/chromium` by default;
set `CHROMIUM_PATH` for a different installed Chromium binary. To check the
public deployment:

```sh
STAGING_BASE_URL=https://lean-design-stack-staging-20261002.bittu15388.workers.dev npm run verify:staging
```

The verifier checks 1440px, 390px and 320px layouts, local ticket/comment/About
saves, direct ticket reload, reset, All tickets, Notepad, zero unexpected API
request origins, no service worker, security headers and axe accessibility
audits on Canvas and the ticket dialog. Screenshot/JSON evidence defaults to
`/workspace/scratch/lean-staging-proof/local`; override `STAGING_PROOF_DIR`.

The full stack validation ran 117 unit tests, 186 local E2E tests and 215
Storybook tests with accessibility checks. One Storybook typing assertion
passed on a targeted rerun. The YAML-transfer E2E assertion now checks the
card's accessible title so the new hidden comment-count badge does not alter
the expected title; the corrected test passed.

## Deployment receipt — 2026-10-02

Cloudflare deployed version `682bf6d3-4614-44b0-8f20-f7a713c6dbec` at 100%.
Its Workers subdomain is enabled, preview URLs are disabled, and the deployed
Worker has zero bindings. Production Worker deployment metadata and the
package-lock SHA-256 remained unchanged after staging deployment.

The identical build passed local Worker browser checks at 1440px, 390px and
320px, including zero axe violations on Canvas and the ticket dialog.
Public browser/HTTP verification was blocked by the execution environment's
network proxy (403 / ERR_TUNNEL_CONNECTION_FAILED), including after a network
permission escalation. An independent web fetch also could not access this
new hostname. The URL is provisioned and deployed; live browser behavior is
not independently verified from this environment.

This staging Worker can be removed independently when the demo is no longer
needed. Removal is a separate explicit action. Do not use the production
`npm run deploy` command for this demo.
