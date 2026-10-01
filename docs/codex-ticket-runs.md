# Minimal ticket → Work integration

## Scope of this PR

Add the app side of a Lean MCP workflow: one Run Codex button, the latest run's
status/message, and its summary/PR link in the existing ticket dialog. Put it
below the title so it is visible on mobile before the description. Keep the
current theme and leave ticket content, columns, comments and exports unchanged.

There is no Codex CLI service, API key, new Cloud environment, run-history screen,
immediate cancellation, polling loop, or new npm dependency. A new attempt replaces the
previous terminal run; blocked work remains active until the integration resolves
or confirms it stopped. Results mean ready for review, never automatically done or merged.

**This PR does not implement or connect the Lean MCP server.** This repository
currently hosts a static frontend on Cloudflare and uses Firebase directly.
Saving a queued document alone does not wake Work. The separately connected MCP
service must consume the request and deliver the MCP event described below.
The button stays disabled until that service publishes a valid subscription.

## Implementation plan

1. Add an independent current-run document and owner-only request rules.
2. Add a transaction to request a run from the saved title/description. Reject
   stale tickets and serialize duplicate clicks/tabs into one active run.
3. Listen only while the ticket is open. Show queued, running, needs input,
   ready for review or failed, plus the latest message and update time.
4. Make the MCP service the sole writer of progress/results. Display stale or
   cached data honestly; never treat a missing update as successful completion.
5. Verify mobile states, error recovery, ownership, concurrency and deletion.
6. Deploy Firestore rules before the frontend. Connect the MCP service and verify
   one real end-to-end run before publishing subscription readiness.

## Firestore contract

Base: `users/{ownerId}/workspaces/default/canvases/{canvasId}/boards/default`

| Document | Fields | Writers |
| --- | --- | --- |
| `integrations/codex` | `enabled: boolean`, `expiresAt: Timestamp` | Trusted MCP service only |
| `codexRuns/{cardId}` | `runId`, `cardId`, `requestedBy`, `title`, `description`, `status`, `message`, `summary`, `prUrl`, `createdAt`, `updatedAt`, optional `workUrl`, optional `stopRequestedAt` | Owner requests; trusted MCP service updates |

Run IDs are UUID v4. Timestamps are Firestore server timestamps. New requests have
`status: queued` and empty message/summary/PR URL. Status values are `queued`,
`running`, `blocked`, `ready_for_review`, `failed`, `cancelled`. Message is plain text up to
2,000 characters; summary up to 10,000. PR links must be HTTPS GitHub pull requests.
Work links must be HTTPS `chatgpt.com/c/{conversationId}` URLs without credentials or custom ports.
Long updates collapse to a three-line preview; PR/Work links remain outside it.
The subscription document contains **no callback URLs, secrets, or credentials**.

Owners cannot write progress, overwrite active runs, impersonate another requester,
change the saved instruction snapshot, or enable a subscription from the browser.
Existing commenter agents get no new permission. The MCP backend authenticates and
authorizes the connected owner/project before using its server credentials; those
credentials never enter the browser or the Work sandbox.

Run documents are not included in YAML exports/imports. New clients clean them up
when deleting a ticket or project, and remove project readiness on project deletion.
The integration must also stop processing deleted projects/tickets and unsubscribe.

## Separate Lean MCP integration

1. Install the Lean MCP plugin in Work and establish an authorized subscription to
   a custom `ticket.run_requested` event, filtered to the owner and project.
   Implement discovery, `events/list`, `events/subscribe`, `events/unsubscribe`,
   callback verification and signed webhook delivery using MCP protocol
   `2026-07-28`. Store callback secrets privately on the MCP server.
2. Once callback verification succeeds and the request consumer is operational,
   publish readiness with the granted subscription expiration. Refresh it with the
   subscription and disable it on disconnect. Never enable it merely because the
   plugin was installed. Verify account support in a real Work subscription first.
3. Watch queued run documents as a durable outbox. Reconcile after restarts and
   retry transient delivery failures using the same event ID (`runId`). Include
   owner/project/ticket/run IDs in the event. A webhook acknowledgement is delivery,
   not proof that Codex started. Keep the run queued until it is claimed.
4. Expose `get_ticket`, `claim_run`, `update_run`, and `finish_run`. Claim and update
   transactionally: match the authenticated owner/project, current `runId`, and
   existing active board/card; reject stale callbacks and invalid transitions.
   Claim queued work once; duplicate delivery must not launch another agent.
   Never recreate a deleted run or accept result writes for a newer attempt.
5. The Work skill reads the immutable request snapshot, works on the configured
   repository, and reports milestones. `finish_run` records the PR and summary.
   Ordinary updates must not reopen terminal runs. Repeating the same finish call
   is idempotent. Treat ticket text as task data within the subscribed instructions.
6. On claim, publish `workUrl` when a verified conversation URL is available. For
   a recoverable blocker report `blocked`; the user answers in that Work conversation.
7. Watch `stopRequestedAt` as a durable stop request, including queued runs. Deliver
   an idempotent `ticket.stop_requested` event keyed by `runId:stop`. A stop request
   wins over a queued claim. For running work, have the skill stop at a safe boundary
   and call `finish_run` with `cancelled` only after execution is confirmed stopped.
   Reconcile missed events; do not depend on the original Work session to recover.
   If the run cannot be located, keep the stop pending and report how to resolve it;
   a trusted operator can confirm it stopped after checking the conversation.
   Never mark a run stopped merely because a timeout elapsed. Fence every update by
   current run ID, retain terminal-state protection, and ignore late callbacks.
   The app only writes `stopRequestedAt`; it cannot claim execution has stopped or
   start another run until the trusted service records a terminal status.
8. Publish subscription readiness only after BOTH request and stop consumers are
   operational. Test queued-stop, running-stop, duplicate stop, and late-finish races.

The separate MCP service owns event delivery and recovery, rather than relying on
an open browser. A stopped Work session may never call `finish_run`; after ten
minutes without a milestone the app shows “No recent update” and keeps its status.
While offline it shows cached status and disables new runs and stop requests.
A listener failure stays visible until Retry restarts both subscriptions successfully.
A remote card edit disables Run until the user closes and reopens the ticket to review
it. The submitted snapshot is always the visible draft and must match saved fields.

Official references:
- [MCP Events](https://developers.openai.com/plugins/build/mcp-events)
- [Connect a plugin in Work](https://developers.openai.com/plugins/quickstart)

## Validation and preview

Storybook: **Kanban / Codex run** includes ready, running, result, disconnected,
blocked, failed, stale, unsaved-ticket and request-error states. These use an
isolated in-memory client; previews never launch Work or write production data.
Mobile screenshots in `docs/pr-proofs/codex-runs/` show the actual components with
synthetic status data, including an illustrative existing PR link.
Reproduce the screenshots and interaction checks with `node scripts/verify-codex-preview.mjs`.

Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
Firestore emulator coverage lives in `emulator/ticket-runs.test.ts` and runs in CI.
Use `npm run test:firestore` to run all emulator tests locally with Java installed.
Before activation, check button → queued → signed event → Work claim → progress →
PR result, refresh the ticket, and repeat with a duplicate event and an expired
subscription. That end-to-end check requires the separate MCP service.

## Release gate and audit fixes

CI now deploys **only Firestore rules** before publishing the frontend on main.
Configure the `FIREBASE_RULES_SERVICE_ACCOUNT` Actions secret with a service-account
JSON credential authorized to deploy rules in `trello-lean-canvas-7kvrv` (Firebase
Rules Admin and the project access required by the Firebase CLI). It is written to
an ephemeral restricted file and removed on exit. Missing credentials or rule
validation/deployment failure blocks Cloudflare publication. PR checks receive no
production credentials. This avoids deploying deletion code against old rules that
deny run cleanup and would leave a board behind a deletion tombstone.

The stop flow adds no execution service or Cloud environment. It is an app/MCP
contract; real stop confirmation and Work links require the separate integration.
Do not enable readiness until the full revised contract is implemented and tested.
