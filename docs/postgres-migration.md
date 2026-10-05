# PostgreSQL and Better Auth migration

This implementation adds an opt-in PostgreSQL backend to the existing app. The checked-in release still uses Firebase. Merging this branch does not migrate users, change the live database authority, or enable PostgreSQL writes.

## Implemented

- Same-origin Hono API on the existing Worker; /api/* runs before SPA fallback and is excluded from service-worker navigation fallback.
- Better Auth 1.7.7 with its Drizzle PostgreSQL adapter, Google registration, existing-account email login, disabled-user checks, shared atomic auth rate limiting, and server-disabled email signup.
- Preserved Firebase human UIDs as text; Google provider subjects stay separate. Firebase passwords and sessions are not imported.
- Google-verified password enrollment/change with PKCE, an expiring session-bound challenge, same-account verification, one-use grants, Better Auth password hashing, and revocation of other sessions.
- Owner-scoped workspace/project API; independent canvas/order revisions and stale-write rejection. The browser retains conflicted drafts and blocks further saves until reload.
- Normalized ticket, column, comment, and hierarchy tables. JSONB retains Lean Canvas sections, About tabs, notes and activity. Transactional commands preserve leaf-only deletion, sibling ranks and IST activity.
- Idempotent command/import receipts, scoped hashed agent credentials, server-assigned new-comment attribution, and a PostgreSQL agent CLI.
- One revision feed per signed-in user, polled every two seconds while visible, with reconnect/backoff and account isolation. Existing repository shapes and local Storybook fixtures remain.
- Source export/audit/import tooling and schema migrations. CI runs PostgreSQL integration tests against PostgreSQL 17, in addition to Firebase regressions.
- Actual cookie-authenticated browser regression, without the app's local auth/persistence bypass.

The API currently retains the existing complete-board response shape. The summary query omits descriptions and comments; loading a full board still loads its full thread history. Pagination, SSE, public sharing, team permissions and PR 29's Codex run storage are separate work.

## Release gates still required

1. Provision separate staging and production PostgreSQL databases, preferably PostgreSQL 17 or newer. Enable TLS, backups and restore testing. Set a runtime role without DDL access and a separate migration role.
2. Create a Hyperdrive binding with query caching disabled. Authentication, ownership and revision reads must not use cached SQL results.
3. Deploy staging and test actual Google OAuth, password verification, session cookies and hashing/connection limits in workerd. Local API tests do not prove Google/Hyperdrive production connectivity.
4. Export and rehearse with actual Firebase data. No production export, live account count or credentials were available in this implementation session.
5. Confirm one-time Google sign-in/password re-enrollment and two-second polling are acceptable. Existing Firebase password hashes and cookies will not work in Better Auth.
6. Rehearse the write barrier, import verification and rollback procedure before switching production.

Keep the PR in draft until these gates have evidence. Do not remove Firebase libraries/rules/configuration until the observation period completes.

## Local verification

Use Node 22.12+ and npm 11.17.0, as required by the repository.

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run test:postgres
npm run test:e2e:postgres
npm run deploy:dry-run
```

Without TEST_POSTGRES_URL, integration tests use PGlite, a PostgreSQL engine in-process. With TEST_POSTGRES_URL set to a dedicated test server, each suite creates a random lean_test_* schema and drops only that schema on completion. CI uses this real-server path. Never point the test variable at a production database. Browser fixtures create synthetic Google-linked users and real Better Auth password sessions; Google itself is not mocked into a claimed production pass.

The optional PLAYWRIGHT_CHROMIUM_EXECUTABLE setting supports an already-installed Chromium when Playwright's download is unavailable.

## Configuration

The frontend's build-time VITE_DATA_BACKEND defaults to firestore; set it to postgres only for the candidate release. The Worker separately checks DATA_BACKEND. Both must agree.

Copy wrangler.postgres.example.jsonc to the ignored wrangler.postgres.local.jsonc, fill in the actual staging hostname and cache-disabled Hyperdrive binding, and configure these Worker secrets through the deployment environment:

- BETTER_AUTH_SECRET: a securely generated secret of at least 32 characters.
- GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET: the OAuth application's server credentials.
- DATABASE_URL is for local development only when no Hyperdrive binding is present; it must never be a VITE_* variable.
- BETTER_AUTH_URL is the exact origin, without a trailing slash or path.
- DATA_BACKEND=postgres, WRITES_ENABLED=false and AUTH_REGISTRATION_ENABLED=false are the safe initial candidate settings.

Register both callbacks for each intended origin:

- /api/auth/callback/google
- /api/account/google/callback

Do not enable arbitrary preview origins or automatic email-based account linking. Preserve the Google provider subject from the Firebase export; otherwise a Google login can create a second identity.

```bash
# DATABASE_URL is injected for the migration role, never included in a committed command.
npm run db:migrate

# Build the candidate frontend. Deploy only after authorized staging/release review.
VITE_DATA_BACKEND=postgres npm run build
npx wrangler deploy --config wrangler.postgres.local.jsonc --dry-run
```

For local development use a local PostgreSQL DATABASE_URL in .dev.vars, configure the exact frontend origin, start the Worker on 8787 and Vite on its own port. Vite proxies /api to the Worker. The browser integration fixture supplies its own isolated API instead.

The existing main-branch workflow still deploys the default Firebase configuration. Candidate PostgreSQL configuration and database migrations are deliberately not run automatically on merge. Do not change the main workflow to PostgreSQL until its build mode, binding, auth configuration and cutover gates are updated together.

## Data export and import

Export uses a short-lived IAM FIREBASE_ACCESS_TOKEN and known Firebase project ID. It recursively enumerates collections, including missing parent documents, at a fixed Firestore readTime, then exports Auth metadata. It performs read operations only. Firestore and Auth are not one atomic snapshot; final export therefore requires the write/identity barrier described below.

Keep exports under ignored migration-private/ or another private path. Output files are created with mode 0600 and never overwritten. The export excludes password hashes and OAuth tokens because this implementation uses re-enrollment.

```bash
mkdir -p migration-private
npm run db:export:firebase -- --project trello-lean-canvas-7kvrv --out migration-private/source.json

# Default: source validation and counts, with no destination writes.
npm run db:import:firebase -- --source migration-private/source.json

# Explicit target identity and a separately injected migration DATABASE_URL are required.
MIGRATION_TARGET=staging npm run db:import:firebase -- --source migration-private/source.json --apply --target staging
```

Preflight rejects duplicate identities/emails/provider subjects, unknown or orphan collections, malformed graphs, stale child counters and boards in importing/deleting states. Recover interrupted source operations first. Current schemaVersion 2 child documents are authoritative; stale compatibility arrays are not imported as additional projects.

Each owner imports in a transaction with a source checksum. The importer verifies canvas content, board content and revisions before recording completion. Identical reruns verify the destination and do nothing; changed source or post-import edits stop the rerun. IDs are not forced into UUID columns, and source timestamps remain in the private export/project source metadata. Normalization treats missing parent/estimate as null and missing authorType as historical user.

The script does not merge into an existing Better Auth user, guess orphan ownership, migrate pending browser-only drafts, or repair partial cloud imports automatically. These cases must be resolved from the source/recovery copy. Extremely long text IDs/ranks must be rehearsed against the target indexes; a constraint failure rolls back that owner's transaction. Completed owners remain checkpointed for resume.

## Cutover and rollback

1. Rehearse a full import into staging, verify the private report and restore a backup. Measure the maintenance interval.
2. Preserve unsaved browser drafts and let pending imports finish. Pause agent clients, MCP integrations, admin scripts and scheduled writers.
3. Deploy a temporary Firestore write-deny rule and verify an old client/token cannot write. Admin SDK/IAM writers bypass Firestore rules, so separately pause or revoke their write capability.
4. Freeze Firebase identity mutations or implement a verified final reconciliation before exporting Auth. A hidden signup button or a frontend flag is insufficient.
5. Take final immutable source exports. Import into PostgreSQL with external registration, password changes and application writes disabled.
6. Deploy the candidate with matching frontend/backend settings. Validate health/schema, migrated identities and deep links. Read-only workspace startup works during this gate; mutation attempts show a maintenance error.
7. Enable PostgreSQL writes and registration together, reissue scoped agent credentials and resume migrated integrations. Keep Firebase writes denied.
8. Observe auth failures, 409 conflicts, API errors, DB connections and update propagation. Retain Firebase and backups for the agreed retention period.

Before PostgreSQL accepts real writes, restore the recorded compatible Firebase frontend/config/rules if verification fails. After new writes or credentials exist, first freeze both sides and preserve PostgreSQL. Prefer fixing forward. A rollback to Firebase then needs a separate reverse data/auth migration; reverting only the frontend would lose new work.

Migrations run only from the explicit CLI, not on Worker requests. The schema runner verifies checksums of previously applied migrations and uses a transaction/advisory lock.

## Agent credentials

A trusted operator with DB access provisions a project-scoped credential:

```bash
npm run agent:credential -- --owner OWNER_UID --canvas PROJECT_ID --name 'Review agent' --expires '2026-11-01T00:00:00Z' --out migration-private/agent-token
npm run agent:credential -- --revoke CREDENTIAL_ID
```

Inject the private file's token into the agent's LEAN_AGENT_TOKEN environment. Do not put it in a prompt, CLI argument, URL, PR or log.

```bash
printf '%s\n' 'Tests pass. Ready for review.' | npm run comment:agent:postgres -- --canvas PROJECT_ID --card TICKET_ID --id stable-review-id
```

The CLI defaults to https://lean.addorimprove.com. --origin accepts an explicit HTTPS origin or loopback development origin. HTTP redirects are rejected so credentials are not forwarded. Reuse the exact comment ID/content for retries. The API assigns identity and timestamp; supplied author labels cannot impersonate another principal.

Credentials allow assigned-board reads and comment append only. Revocation is checked against the database on each request. The old Firebase CLI remains available during transition.

## Operations

Restrict migration/provisioner DB access to trusted operators. The runtime needs DML access to application/auth tables, not schema ownership. Runtime access to migration_records and schema_migrations is unnecessary; health only needs app_schema_version.

Delete expired password challenges and old rate-limit rows during routine maintenance. Define receipt retention before pruning command_receipts: deleting a receipt can remove request-level replay protection. Back up identity and application tables together. No cleanup job or automatic data deletion is enabled by this PR.

