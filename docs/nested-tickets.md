# Nested tickets

Every ticket can contain child tickets, without a configured depth limit. The project board shows root tickets only. A ticket's detail view lists its immediate children and provides **Open board** for those children. Child boards reuse the existing Kanban component, project columns, status editor, comments, and story points.

## Navigation and behavior

- Existing detail URLs remain `/project/:projectId/ticket/:ticketId`.
- Child boards use `/project/:projectId/ticket/:ticketId/board` and support reload/back/forward.
- Breadcrumb ancestors open their boards; the current board's ticket title opens its details. Breadcrumbs in details open ancestor details.
- Closing a child ticket returns to its containing board.
- Child creation from details starts in Backlog (or the first available column). Creation on a child board uses the chosen column.
- Every ticket has an independent status and estimate. Completion badges count immediate children in Done or Closed; completing children does not move the parent.
- All Tickets retains active tickets at every depth and shows ancestor titles for context.
- Columns are shared across a project: renaming, reordering, adding, or deleting a column affects every nested board. Columns with any tickets at any depth cannot be deleted.
- Parents cannot be deleted while they have children. Delete descendants explicitly, starting with leaves. Project deletion retains its existing whole-project behavior.
- Parent links are set at creation; moving existing tickets between parents is outside this change. No implicit dependencies or automatic agent orchestration are introduced.

## Persistence

`parentTicketId?: string | null` is added to card and summary schemas. Missing/null denotes a root, so old records need no migration. Ranks are unique within `(parentTicketId, columnId)`, and moves calculate ranks only against siblings.

Local storage, Firestore records, summaries, and YAML preserve the relation. Validation rejects missing parents, cycles, and duplicate sibling ordering. Validation and ancestor traversal are iterative. Imports validate the complete tree, then write parent layers before descendants; normal card writes require an existing parent in the same project. Firestore rules prevent rewriting parent links. Deletion checks for an immediate child with a limit-one query and verifies the board revision before acquiring the existing deletion tombstone, preventing concurrent child creation from orphaning a ticket through application writes.

Firestore also maintains `boards/default/childCounts/{parentTicketId}` guards separately from editable card data. Each child create/delete atomically increments/decrements its parent's count and records the changed child ID. Rules verify that the corresponding child is actually created/deleted in the same commit, and reject a non-leaf deletion tombstone before any comments are drained, including requests from older clients. Nested imports use one transaction per child, skip already committed children on resume, and keep roots/comments batched. Whole-project deletion removes the guards after draining cards. These guards are internal and are not exported in YAML.

This reuses the current project snapshot and subscription architecture. Only the current level is rendered; Firestore still loads the project's cards and comments as before. Descendant pagination/lazy database reads are a separate scalability improvement, not part of this change. No MCP ticket CRUD implementation exists in this checkout, so no separate MCP API is added here.

## Release prerequisite

Deploy this PR's `firestore.rules` before publishing the frontend. Existing GitHub CI deploys Cloudflare only; it does not deploy Firestore rules. With old rules, child creation is denied. Use the existing Firebase deployment process, or `npx firebase-tools@15.28.2 deploy --only firestore:rules` with the correct project and authorized credentials. This PR does not deploy production.

Reload older clients after release: their strict schemas do not understand `parentTicketId`, although the rules now block their attempts to delete non-leaf parents. Avoid rolling back the frontend after nested records exist without a compatible reader. Flat production boards need no counter migration. Any preview database populated by an earlier revision of this unreleased PR must be reimported into a new project or have its child counters backfilled by an authorized administrator before use with these rules.

## Validation

- Unit coverage: independent ordering/status, graph validation, summaries, YAML round trips, and 10,000 levels.
- Emulator coverage: nested persistence, leaf-only deletion, invalid parent writes, immutable parent links, reverse-order and resumed imports, legacy-client deletion rejection, forged counters, create/delete races, and guard cleanup on project deletion.
- Browser coverage: nested navigation, reload/back, sibling scoping, drag and status edits, draft protection, active descendants, missing parents, desktop/mobile layout, and long/unbroken column names on mobile.
- Screenshot fixtures: `tests/nested-tickets-layout.spec.ts`; captures in `docs/pr-proofs/nested-tickets/`.
