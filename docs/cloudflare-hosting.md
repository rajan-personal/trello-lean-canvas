# Cloudflare Workers Static Assets cutover

## Production configuration

`wrangler.jsonc` serves `dist` with `not_found_handling: single-page-application` and a current compatibility date. It declares `lean.addorimprove.com` as a Workers Custom Domain and keeps the `workers.dev` endpoint enabled. There is no Worker script, binding, or backend migration. Firebase Auth and Firestore stay unchanged. The local Wrangler dependency is lockfile-pinned.

### Cutover receipt — 2026-09-07

- Worker: `trello-lean-canvas`; version `1d6ca6ee-d361-4ac1-8cd5-704fa4cc97c4`.
- Production: https://lean.addorimprove.com; alternate endpoint: https://trello-lean-canvas.bittu15388.workers.dev.
- The old DNS-only CNAME `lean` → `rajan-personal.github.io` used Auto TTL (observed 300 seconds), with no tags/comment. This is the rollback record; GitHub Pages was not disabled.
- Initial Custom Domain attachment failed with Cloudflare error 100117 because of the existing CNAME. Removed only that record through the authenticated DNS dashboard, then `wrangler triggers deploy` successfully attached the domain. No unrelated DNS records changed.
- After local DNS propagation, ordinary HTTPS requests to `/` and all three project/ticket route shapes returned the exact production `dist/index.html` SHA-256, without DNS overrides. The Cloudflare edge returned HTTP 200.
- Browser smoke on the Workers endpoint passed deep-link login rendering and asset responses. The pre-cutover signed-in browser retained its old GitHub connection/shell during the verification window, even after a service-worker update request. Its authenticated new-shell transition and fresh Google sign-in are not yet verified. Do not clear local user data to address this; reconnect/reopen the app after DNS/connection caches expire.
- Firebase configuration, authorized domains, rules, and application data were not changed. The alternate `workers.dev` hostname has not been authorized for Google sign-in; use the production hostname.

```sh
npm ci
npm run deploy:dry-run   # production build + local validation, no upload
npm run preview:worker  # local Workers asset serving; build first
```

`npm run preview:worker` serves a **production** build by default, so signing in would use real Firebase. For local-only browser checks build with `npm run build -- --mode test` first; test auth bypass works only on loopback hosts. Never publish a test-mode build. `npm run deploy` always rebuilds in production mode.

Vite already uses the origin-root base `/`. Manifest icons are explicitly root-relative; PWA scope/start URL are `/`, and Workbox navigation fallback is `/index.html`. Scripts, CSS, lazy chunks, YAML sample imports, and icons therefore resolve on deep routes. The service worker caches the application shell, not Firebase user data. A new origin has separate service workers, caches, localStorage, and Firebase login state. Keeping the existing custom hostname retains that origin's state; do not clear user data during cutover. The obsolete GitHub Pages `public/CNAME` asset and `gh-pages` publisher have been removed. Firebase deployment remains a separate explicit command; there is no combined frontend/backend deployment script.

## Future release / rollback checklist

1. Review and approve the source diff and tests. Keep the existing GitHub Pages site, custom-domain settings, and Firebase authorized domains intact until the candidate is verified. Record current DNS records/TTL and the current Pages deployment for rollback. Do not republish the old site from this Workers-only configuration.
2. Confirm the Cloudflare account and intended Worker name `trello-lean-canvas`. Authenticate Wrangler in the release owner's environment, then run `npm run deploy` only with publication approval. The checked-in config now publishes to both the production custom hostname and `workers.dev`. For candidate-only testing, use a separate Worker/config without production routes.
3. For candidate-host Google sign-in, a Firebase project owner must separately approve adding the exact `workers.dev` hostname to Authentication authorized domains (and check Google OAuth origin/redirect restrictions if applicable). Do not remove existing domains or change Firestore rules/data. Firebase public web config is build-time Vite configuration, not a Worker secret or binding.
4. Verify production candidate root, `/project/{id}`, `/project/{id}/ticket`, and `/project/{id}/ticket/{id}` with direct navigation, refresh, login, Back/Forward, blocked draft exits, sign-out/sign-in destination, PWA manifest/install, and lazy assets. Use an approved test account/project for live checks; local automated tests use fake transports or local persistence only.
5. For any future domain/DNS cutover, obtain approval. `lean.addorimprove.com` is already attached as a Workers Custom Domain. Resolve any conflicting records only after recording rollback values. Cloudflare must manage the zone and issue a valid certificate. Do not use a blanket route or alter unrelated DNS. Keep Pages available for rollback.
6. Verify HTTPS and all deep-route flows on the custom hostname, including a browser already controlled by the previous service worker and a fresh browser. The auto-updating service worker should replace the old application shell; if investigating stale caches, preserve local user data and migration copies. Existing installed PWAs on a different origin do not migrate automatically.
7. Roll back by restoring the recorded previous hosting/DNS configuration or an approved prior Worker version. GitHub Pages cannot serve these clean deep paths natively, so a rollback to the old app restores the old navigation behavior, not deep-link support. Retire Pages/domain settings only after a stable observation period and separate approval.

## Routing and guards

The production entry point opts into browser routing. Component/Storybook previews use per-instance memory routing, never shared window history. URLs remain untouched while authentication and workspace data load; unavailable IDs are shown explicitly, never substituted with the first project. Root alone defaults to the first loaded project. Retained deleted Board snapshots are read-only draft recovery views, not save targets.

Navigation entries carry an index. Cancelled same-document Back/Forward restores the original history cursor instead of pushing an extra entry, preserving forward history and mounted drafts. Cross-document exits use native `beforeunload` prompts (browser support/user-activation rules apply). Closing a ticket navigates explicitly to its parent route, including direct-entry tickets. Board drafts and pending canvas/board saves guard workspace navigation; Canvas inline editors retain intentional outside-pointerdown dismissal, but Back/Forward/unload protect their drafts.

## References retrieved during implementation

- https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/
- https://developers.cloudflare.com/workers/wrangler/configuration/
- https://developers.cloudflare.com/workers/best-practices/workers-best-practices/
- Modern Web Guidance `stack-drill-down`: adopted History API synchronization, indexed entries, deep-link close handling, and no push on popstate. Swipe stacks, animation, and unrelated new APIs are not part of this task.
