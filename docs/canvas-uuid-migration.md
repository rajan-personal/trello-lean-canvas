# One-time canvas UUID migration (operator runbook)

This tool moves only non-UUID canvas document IDs in one explicitly selected user's
`default` workspace. It does not change the app, deploy anything, create aliases, or
preserve old URLs. **Dry-run is the default.** Node >=22.12 is required; no new
dependencies. See the completed production execution receipt below.

## Production execution receipt — 2026-09-07

After explicit confirmation that all writers were paused, the operator created a
private immutable plan/full-workspace backup, inspected the exact four-of-twelve
scope, and applied 17 writes in one atomic commit. The CLI returned
`applied-verified`. Independent full-snapshot readback then confirmed:

- All 12 current projects have UUID IDs; the other eight project IDs are unchanged.
- All 12 boards, eight tickets, and zero comments remain present (33 documents
  including workspace metadata), with exact preservation checks passing.
- Old project paths are absent; order, matching compatibility IDs, and board
  references use the saved mapping. Workspace orderRevision advanced from 16 to 17.
- A second application of the same plan returned `already-applied` with a
  write-rejecting verification client, proving no additional writes were needed.

The original plan/backup and verified post-migration snapshot are retained in the
operator's private migration directory outside Git. The mapping and raw user data
must not be attached to the PR. Writers were released after verification. No
frontend or rules deployment was required. Rollback now requires a new review of
any edits since writers resumed; do not replay the old backup unconditionally.

## Approved operation and prerequisites

The completed operation targeted project `trello-lean-canvas-7kvrv`, database
`(default)`, and one explicitly approved user's `default` workspace. The private
pre-migration inventory contained 12 canvases at orderRevision 16, exactly four
non-UUID IDs, and eight UUID IDs to preserve. User identity and exact old/new IDs
are retained only in the private plan.

For any future operation, explicitly authorize its target and scope. Before
applying, privately inspect the plan's `target`, `mapping`, and `before` inventory.
If it differs from the approved inventory, STOP for renewed review; do not blindly
apply. The CLI is target-configured, not hard-coded to the completed operation.

1. Obtain user confirmation to pause **all** app tabs/PWAs, other devices, scripts,
   imports/deletions, and admin writers for this workspace from planning through
   successful readback. Finish pending operations and save/sync edits first.
   `--confirm-writers-paused` is an operator attestation, not an acquired lock.
2. Use an authorized **IAM OAuth access token**, not a Firebase end-user ID token.
   Normal security rules intentionally reject preserved revisions/timestamps and
   active-board deletion. IAM credentials bypass those rules; the tool itself
   limits every read/write to the selected workspace. Keep shell tracing off and
   pass the token only via stdin. Never put it in command arguments, logs, backup,
   source control, or a shell command containing the literal credential.
3. Create a private operator-owned directory outside this repository, e.g.
   `umask 077; mkdir -m 700 /tmp/trello-uuid-private-UNIQUE`. Choose a durable secure
   location instead if `/tmp` may be cleaned. Backup contains actual private data;
   retain it securely until the user accepts the migration, then follow your
   retention policy. Do not attach it to review artifacts.

## Commands

Here `TOKEN_PROVIDER` means the parent's existing private token-producing command;
replace that placeholder with the authorized provider, not with a literal token.
It must write only the access token and optional newline to stdout. Token handling
is deliberately not implemented using Firebase CLI internals.

```sh
TOKEN_PROVIDER | node scripts/migrate-canvas-ids.mjs \
  --project trello-lean-canvas-7kvrv \
  --database '(default)' --uid FIREBASE_USER_UID \
  --plan /tmp/trello-uuid-private-UNIQUE/plan.json --access-token-stdin
```

This performs reads only, generates `crypto.randomUUID()` exactly once per
non-UUID ID, and exclusively creates the combined immutable plan/full-workspace
backup with mode 0600. An existing plan is never overwritten. Parent directory
must be mode 0700 and owned by the operator. Symlinks into the repo are rejected;
plan reads reject symlinks, hard links, non-private permissions, oversized files,
wrong targets, unsupported versions, and checksum mismatch. The SHA-256 detects
accidental editing; it is not a signature against a malicious local operator.
File and directory are fsynced. On failed/incomplete plan creation, do not repair
that artifact; retain it and use a new path for a new read-only dry-run.

After private inspection and the user's explicit paused-writer confirmation:

```sh
TOKEN_PROVIDER | node scripts/migrate-canvas-ids.mjs \
  --project trello-lean-canvas-7kvrv \
  --database '(default)' --uid FIREBASE_USER_UID \
  --plan /tmp/trello-uuid-private-UNIQUE/plan.json --access-token-stdin \
  --apply --confirm-writers-paused
```

Do not release the pause unless output is `applied-verified`,
`applied-verified-after-error`, `already-applied`, or a reviewed `no-op`.
On lost response, timeout, or interrupted process, retain and rerun **the same
plan**, same target, with writers still paused. No automatic resubmission occurs
within one invocation. A fully verified already-applied state makes no writes;
a fresh dry-run after success creates an empty mapping, also a no-op on apply.
Any partial/mixed state or subsequent edit stops, rather than guessing success.
Do not generate a different mapping to recover an ambiguous apply.

After successful readback, reopen/hard-reload online clients from the current
workspace and use the new URLs. Do not replay old offline edits/imports or restore
stale browser state against old IDs. Any unsynced local edits require separate
reconciliation before proceeding.

## Safety model and preserved data

- `batchGet` establishes server `readTime`; all collection discovery and paginated
  document listing use that same time. `listCollectionIds` is checked at every
  level including leaves; `showMissing=true` detects orphan descendants. Unknown
  collections/boards/fields/Value references, malformed schemas, dangling linkage,
  missing ordered canvases, or non-active boards stop the run. If snapshot reads
  expire or the server rejects them, there is **no weaker-read fallback**.
- Entire workspace document names, typed fields, createTime and updateTime are
  backed up. An immediate pre-apply snapshot must equal this backup exactly,
  including the eight unchanged canvases and all descendants. This detects new
  descendants and target collisions, including orphan targets.
- One `documents:commit`, never `batchWrite`: create-only destination writes,
  source updateTime-guarded deletes, and updateTime-guarded workspace update are
  atomic. Every moved source board's updateTime guards supported app child writes
  (the app changes board revision on each active child mutation). A missing source
  board has an `exists:false` delete guard, preventing concurrent initialization.
  Every source child has its own updateTime precondition as well.
- Normal rules enforce workspace membership for canvas creation and canvas/board
  presence for board writes. However, admin writers bypass rules, and arbitrary
  collection insertions are not predicate-locked by these document preconditions.
  **The writer pause is essential**, including for unchanged canvases and target
  orphan subtrees. This is not a general online migration framework.
- Canvas payloads come only from current canvas documents. Workspace `canvasOrder`
  and only mapped `id` values within historical `canvases` compatibility entries
  are remapped. Unmatched entries (including deleted projects) remain unchanged;
  they never create documents or restore workspace membership.
  Historical compatibility content never overwrites newer documents. Board/card/
  comment `canvasId` fields are remapped. All ticket/comment/column IDs, content,
  notes, revisions, original typed timestamps and integers are preserved, including
  optional historical `legacyId` metadata and literal ID strings in free text.
  Optional card `storyPoints` accepts absence, Firestore null, or 1, 3, 5, 8, 13
  in integer/double representation; original typed values are retained exactly.
  Only workspace orderRevision increases by one and workspace updatedAt uses the
  server's `REQUEST_TIME`. New documents naturally have new createTime/updateTime
  metadata; these metadata are not payload fields.
- Post-apply snapshot proves exact planned document set (therefore old paths
  absent), all target fields/subtrees, workspace order and compatibility IDs,
  unchanged-document versions and payloads. Workspace updatedAt must be a valid
  server-window timestamp (REQUEST_TIME is millisecond precision), and workspace
  createTime is preserved. Nothing sensitive is printed in normal/error logs.
- Conservative bounds: 400 writes, 8 MiB serialized commit, 1,000 workspace
  documents, 3,000 enumeration calls, 32 MiB snapshot/plan/response. A write/payload
  limit failure must **not** be worked around with batches. Server index-entry
  overhead may still exceed Firestore's 10 MiB request limit; atomic rejection is
  safe. A larger workspace requires separate review, not an increased limit here.

## Constrained recovery / rollback

There is intentionally no automatic rollback. An old backup must never overwrite
new edits. If readback fails, keep every writer paused and preserve the original
plan; first rerun that plan to distinguish completed apply from an unapplied
commit. An IAM/precondition/limit error is not permission to remove guards.

Manual rollback is only permissible under a separately reviewed atomic inverse
commit **while writers have remained continuously paused**:

1. Read a fresh consistent full snapshot; privately save it exclusively as another
   mode-0600 artifact. Prove it is exactly the plan's expected post-apply state
   (all payloads, subtree membership, unchanged documents, workspace references).
   If any field, version since verified readback, or descendant differs, STOP.
   If clients were resumed, this constrained rollback is no longer approved;
   reconcile subsequent edits with the user in a new recovery plan instead.
2. Restore original canvas/board/child fields from `before.documents` at old
   paths, each with `currentDocument: { exists: false }`. Delete each corresponding
   UUID target with **its freshly read updateTime**, never its creation time and
   never an unconditional delete. Verify no orphan old-path descendants first;
   preserve the same missing-board guard principle on UUID source paths.
3. Restore original workspace order and compatibility IDs, but use **current
   orderRevision + 1**, current workspace updateTime precondition, and REQUEST_TIME;
   do not reset orderRevision to 16 or restore an old timestamp. Do not touch the
   eight unmoved canvases. Require every current supported source board's version
   guard and remain within the same atomic limits. Review the complete inverse
   write set before submitting a single commit.
4. Read back the entire inverse state and old/new subtree absence before resuming
   clients. Any ambiguity is resolved by readback, not by replaying unconditional
   writes. Do not import the compatibility snapshots or perform console copy/delete.

## Validation and references

```sh
node --test scripts/canvas-uuid/plan.test.mjs scripts/canvas-uuid/rest.test.mjs
npx eslint scripts/migrate-canvas-ids.mjs scripts/canvas-uuid/*.mjs
npm run typecheck
npm test
# LOCAL demo project only; JDK >=21 required. macOS JAVA_HOME example:
JAVA_HOME=$(/usr/libexec/java_home) PATH="$(/usr/libexec/java_home)/bin:$PATH" \
  firebase emulators:exec --project demo-canvas-uuid --only firestore \
  'node --test scripts/canvas-uuid/emulator.test.mjs'
```

The emulator tests pin localhost:8080 and a demo project, test full commit/readback,
source-version conflicts, target collisions, successful missing-board guards and
concurrent board initialization. Emulator 1.22.0 rejects valid REST listDocuments
`readTime` with `Only timestamps past epoch are supported`; **only the test-local
transport** removes this query. Emulator validation proves atomic semantics, not
production snapshot isolation. Fake REST tests cover fixed readTime and pagination.
The normal CLI has no endpoint override and does not read emulator environment.

Official references fetched during implementation (no live document access):

- https://cloud.google.com/firestore/docs/reference/rest/v1/projects.databases.documents/commit
  — writes are executed atomically and in order.
- https://cloud.google.com/firestore/docs/reference/rest/v1/Precondition
  — `updateTime` requires the same current version; `exists:false` requires absence.
- https://firestore.googleapis.com/$discovery/rest?version=v1
  — `Write.currentDocument` applies to both updates and deletes;
  `updateTransforms` follows update atomically; REQUEST_TIME has millisecond
  precision; list/listCollectionIds accept readTime; list supports showMissing.

Source contracts: `src/data/{firestore-model,firestore-writes,canvas-schema,board,
board-firestore-model,board-firestore-read,board-firestore-writes,
board-firestore-import,board-firestore-delete}.ts` and `firestore.rules`.
