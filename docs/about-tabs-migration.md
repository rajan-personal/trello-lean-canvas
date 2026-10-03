# About tabs — migration plan

## What changes in stored data

| Store | Before | After |
| --- | --- | --- |
| Firestore `users/{uid}/workspaces/default/canvases/{id}` | `about: string` | `about` unchanged (Overview tab) + optional `aboutTabs: { id, title, content }[]` (max 5) |
| Local storage `lean-canvas:v2` | `about` | same, + optional `aboutTabs` |
| YAML export | `canvas.about` | + `canvas.aboutTabs` |

Existing data needs **no backfill**: a missing `aboutTabs` decodes to `[]`, and `about` keeps feeding the Overview tab.

## Compatibility risks

1. **Rules before client.** Merging to `main` deploys the client to Cloudflare automatically, but `firestore.rules` is deployed by hand (`npm run deploy:firebase`). A client that writes `aboutTabs` against old rules has its writes rejected, because `validCanvas` uses `keys().hasOnly`.
2. **Old bundles are strict.** Clients built before this change parse canvases with `z.strictObject`. When such a client sees one document containing `aboutTabs`, `decodeCanvas` throws and the whole workspace subscription errors. Its local-storage parse falls back to `[]`. Old bundles fail before they write, so nothing is lost, but the stale tab is unusable until it reloads.
3. **Rollback.** Reverting the client to a pre-tabs build after any user has saved a tab triggers risk 2 for that user.

## Mitigations in this PR

- Empty `aboutTabs` is **omitted** from Firestore writes (`canvasPayload`) and from local storage (`serializeCanvases`). Projects that never use tabs therefore stay byte-compatible with old bundles. Only documents that actually have extra tabs carry the new key.
- The new rule is additive and optional (`!hasAny(['aboutTabs']) || list && size() <= 5`), so it is safe to deploy ahead of the client.
- The PWA uses `registerType: 'autoUpdate'`, so stale tabs pick up the new bundle on the next service-worker check or reload.

## Rollout order

1. **Deploy rules first:** `npm run deploy:firebase`. This is safe with the current production client because the new key is optional.
2. Run the emulator rules suite against the new rules: `npm run test:firestore`.
3. **Merge the PR.** CI deploys the client and verifies `lean.addorimprove.com` serves the new build.
4. Smoke test in production: open About, add a tab, save, reload, then check the Firestore console shows `aboutTabs` only on that canvas.
5. Watch for "Invalid canvas" sync errors from any stale open tabs; a reload clears them.

## Rollback

- **No tabs saved yet:** reverting the client is safe. Leave the rules as they are; they are backward compatible.
- **Tabs saved:** do not revert to a pre-tabs build. Ship a forward fix instead. If a revert is unavoidable, first remove `aboutTabs` from the affected canvas documents (move their content into `about` if it must be kept), then revert.

## Later (optional)

- Fold `about` into `aboutTabs[0]` only if the Overview tab ever needs renaming or reordering. That would need a real backfill and a second expand/contract release, so it is out of scope here.
- Worst case, six tabs at 100k characters each approaches Firestore's 1 MiB document limit. If that becomes a problem, add a combined cap or move tabs into a subcollection.
