# About tabs — migration plan

## What changes in stored data

| Store | Before | After |
| --- | --- | --- |
| Firestore `users/{uid}/workspaces/default/canvases/{id}` | `about: string` | `about` unchanged (Overview tab) + optional `aboutTabs: { id, title, content }[]` (max 5) |
| Local storage `lean-canvas:v2` | `about` | same, + optional `aboutTabs` |
| YAML export | `canvas.about` | + `canvas.aboutTabs` |

Existing pre-tabs data needs **no backfill**: a missing `aboutTabs` decodes to `[]`, and `about` keeps feeding the Overview tab. Extra tab IDs must be unique and cannot be `overview` (reserved for the pinned tab). Both the client schema and Firestore rules enforce the entry shape and field limits. If earlier preview builds stored invalid entries, back up and repair them before loading this build: cloud validation rejects them, while local-preview parsing falls back to an empty workspace that autosave can persist.

## Compatibility risks

1. **Rules before client.** Merging to `main` deploys the client to Cloudflare automatically, but `firestore.rules` is deployed separately. Use the rules-only command below for this release; `npm run deploy:firebase` also deploys Auth configuration and Firestore indexes. A client that writes `aboutTabs` against old rules has its writes rejected, because `validCanvas` uses `keys().hasOnly`.
2. **Old bundles are strict.** Clients built before this change parse canvases with `z.strictObject`. When such a client sees one document containing `aboutTabs`, `decodeCanvas` throws and the whole workspace subscription errors. Cloud reads fail validation, leaving the stale tab unusable until it reloads. In local-persistence previews/tests, the old local-storage parser instead falls back to `[]`, which its startup autosave can write back over the original data. Do not open tabs-bearing local data with an older preview build; back it up before any rollback.
3. **Rollback.** Reverting the client to a pre-tabs build after any user has saved a tab triggers risk 2 for that user.

## Mitigations in this PR

- Empty `aboutTabs` is **omitted** from Firestore writes (`canvasPayload`) and from local storage (`serializeCanvases`). Projects that never use tabs therefore stay byte-compatible with old bundles. Only documents that actually have extra tabs carry the new key.
- The new rule is additive and optional: when present, `aboutTabs` must contain at most five valid entries with unique, non-reserved IDs. It is safe to deploy ahead of the client.
- The PWA uses `registerType: 'autoUpdate'`, so stale tabs pick up the new bundle on the next service-worker check or reload.

## Rollout order

1. **Integrate current `main` before deploying anything:** from a clean `feat/about-tabs`, run `git fetch origin` then `git merge origin/main`. At planning time, `origin/main` is `aac88bf`, four commits ahead of this branch's base; those commits add nested-ticket security rules. Review the merged `firestore.rules` to retain both nested-ticket protections and About validation. Never deploy this branch's older rules snapshot over production.
2. Validate the integrated branch: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:firestore`, then `npx playwright test tests/project-about*.spec.ts tests/nested-*.spec.ts tests/canvas-transfer-regressions.spec.ts tests/workspace-routing*.spec.ts --workers=2`. Run `npm run test:storybook -- src/components/ProjectAbout.stories.tsx src/components/ProjectAboutTabs.stories.tsx` and finish with `npm run deploy:dry-run` (which rebuilds in production mode after browser tests).
3. Push `feat/about-tabs` and open a PR against `main`; no PR existed when this plan was prepared. Include the validation results and this rules-first checklist. Require green CI and review approval; do not enable auto-merge before the rules deployment is confirmed.
4. **With deployment approval, deploy only the integrated rules:** `npx -y firebase-tools@15.28.2 deploy --only firestore:rules --project trello-lean-canvas-7kvrv`. Record the deployed commit and successful CLI output in the PR. The About field is optional, so the additive rules remain compatible with the current production client; no data migration or Auth change is required.
5. Fetch `origin/main` again. If the base or PR head changed since validation/deployment, stop, reintegrate and repeat the affected checks and rules deployment. **Only then squash-merge the approved PR.** CI on `main` deploys the client and verifies `lean.addorimprove.com` serves that exact build; watch the complete workflow, not just the PR checks.
6. Smoke test with a designated test project on desktop and phone: add, rename, reorder and delete sections; save and reload; verify keyboard focus and existing Overview content. Also check nested-ticket creation and parent deletion protections. Avoid altering real user projects. Verify only the intended canvas has the new tab data.
7. Watch for "Invalid canvas" sync errors from stale open clients; reload to upgrade them. Record smoke-test results and the production workflow URL in the PR. Follow the rollback restrictions below if anything fails.

## Rollback

- **No tabs saved yet:** reverting the client is safe. Leave the rules as they are; they are backward compatible.
- **Tabs saved:** do not revert to a pre-tabs build. Ship a forward fix instead. If a revert is unavoidable, first remove `aboutTabs` from the affected canvas documents (move their content into `about` if it must be kept), then revert.

## Later (optional)

- Fold `about` into `aboutTabs[0]` only if the Overview tab ever needs renaming or reordering. That would need a real backfill and a second expand/contract release, so it is out of scope here.
- Six tabs at 100k characters each can exceed Firestore's 1 MiB document limit with multibyte text, even before notes and canvas cards are included. A combined byte budget or a tab subcollection is still needed to guarantee every size-valid draft can be saved; per-tab character limits alone do not guarantee this.
