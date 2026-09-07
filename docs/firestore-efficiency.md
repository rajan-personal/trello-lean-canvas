# Firestore read reduction

Ticket: [firestore is very inefficient. optimize it](https://lean.addorimprove.com/project/784e23a5-f292-46f8-8278-86491719e4fc/ticket/1d0fe84e-7eb0-4a10-a63e-1c29aea40c98)

## Changes

- The Canvas view no longer subscribes to or loads its hidden ticket board.
- Workspace sync initializes only newly saved boards and processes pending imports. Existing, unopened boards are initialized on demand when opened or exported. New-board initialization after the canvas save also wakes a board opened before that save completed.
- An account/repository-scoped, live-subscription-only cache coalesces overlapping reads. Navigation/unsubscribe discards it. Consumers receive cloned data, not the internal write baseline.
- Normal board mutations reuse the loaded snapshot, validate its revision and active status inside the existing Firestore transaction, and publish the acknowledged result to the cache. No optimistic cache state is treated as durable.
- Listener metadata echoes do not invalidate the cache. Acknowledgments and explicit post-save reloads reuse the committed snapshot. Loads triggered during a write wait for its outcome. Remote changes, failures, and deletion states invalidate cached data.
- Card deletion queries comments by `cardId` on the server instead of downloading every comment. Cleanup queries and deletes at most 200 records at a time, preserving the durable tombstone/recovery protocol.

## Read budget

Let C and M be the board's card and comment document counts. The existing consistent full read uses two board-document reads plus two collection queries (roughly C + M + 2 document reads; empty queries have a minimum charge).

Previously a normal edit performed that full read before its transaction, then again for listener notifications and the explicit UI reload. Now an edit with a live, loaded baseline performs **zero card/comment collection reads**: one board-document transaction read plus the normal listener update, excluding transaction retries and security-rule dependent reads. It still writes the board revision and changed child records only.

Initial loads, external edits, exports without a live subscription, deletion recovery, and conflict retries retain the full revision-sandwich read. This is a bounded improvement, not a claim that all workspace reads are eliminated. The startup deletion-recovery scan and workspace-wide canvas subscription remain unchanged.

## Safety and validation

The Firestore schema, rules, and indexes are unchanged; the filtered deletion query uses the existing default single-field index. Migration/import reservations, revision conflict detection, author validation, and durable deletion tombstones remain in place. No persistent/offline cache or TTL is introduced.

Regression coverage:

- `unit/board-remote-cache.test.ts`: initialization/read budgets, acknowledgment coalescing, invalidation during reads.
- `unit/board-remote-races.test.ts`: delayed acknowledgments, account isolation, listener failures, retries, immutable baselines.
- `emulator/board-efficiency.test.ts`: real listener acknowledgments, zero collection reads for cached writes, stale-revision rejection, and filtered 200/5-record deletion batches.
- Existing emulator recovery/security tests and browser routing/editing tests remain applicable.

Workflow follows the linked [ECC](https://github.com/affaan-m/ECC) test-first and independent-review approach without installing global tooling. Frontend publication still requires explicit release approval; no production data was changed to validate this fix.
