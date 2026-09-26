# Task comments: users and agents

Task details share a chronological plain-text thread. Comments show the author, **User** or **Agent**, and a timestamp. Historical comments without `authorType` remain User comments. Existing YAML export/import preserves the new optional attribution. No editing, deletion of individual comments, rich text, mentions, reactions, or attachments are introduced.

The task dialog uses a dedicated conversation panel with human initials, agent icons, inline author labels, compact timestamps (full timestamp on hover), and a comment count. The reply composer follows the chronological thread. **Ctrl+Enter / Command+Enter** posts; plain Enter inserts a newline and IME composition is preserved. Narrow screens stack the panels, with the dialog controls remaining visible while scrolling.

User comments retain the existing draft/pending/error behavior. Appends use independent comment documents plus an atomic board-revision update, not a replacement thread. Stable IDs make retries after lost acknowledgements idempotent. Concurrent user/agent posts are retried without overwriting each other. Deleting a task continues to clean up its comments.

## Agent authentication and scope

Use a **dedicated Firebase Auth identity**, not the owner's credentials and not a service-account key in an agent sandbox. A trusted administrator/provisioning service must approve the owner and project and issue these Firebase custom claims:

```js
// Trusted server only; requires Firebase Admin credentials. Never put these in the frontend.
await getAuth().setCustomUserClaims(agentUid, {
  leanRole: 'commenter',
  leanOwnerId: ownerUid,
  leanCanvasId: canvasId,
  leanAgentName: 'Review agent',
});
const customToken = await getAuth().createCustomToken(agentUid);
```

Exchange that custom token for a Firebase **ID token** using Firebase Auth's `signInWithCustomToken` or its REST endpoint:

```text
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=FIREBASE_WEB_API_KEY
Content-Type: application/json
{"token":"CUSTOM_TOKEN","returnSecureToken":true}
```

Supply the response's `idToken` through the agent's secret environment as `FIREBASE_ID_TOKEN`. Never commit tokens, put them in URLs, or paste them in PRs. ID tokens normally expire after one hour; obtain/refresh them through the trusted provisioner. Removing claims takes effect when a new token is issued; already-issued ID tokens retain their claims until expiration. There is no self-service agent provisioning UI in this change.

Rules limit the agent to reading its assigned board, cards, and comments and creating attributed comments. It cannot read workspace metadata/other projects, change task content or columns, or update/delete comments. The required board revision bump is limited to `revision` and `updatedAt`. The comment's `authorId` must equal the authenticated UID, and its name must equal `leanAgentName`. The board owner retains existing access, including importing archived user/agent comments.

## Post from an agent

Node 22.12+ and `npm ci` are required. Keep a stable, unique `--id` for each logical comment; reuse it unchanged for retries, and use a new ID for new content. All options below are required. Body text comes from stdin (1–10,000 characters after trimming).

```bash
# FIREBASE_ID_TOKEN is injected by the trusted provisioner, not passed as a CLI argument.
printf '%s\n' 'Tests pass. Ready for review.' | npm run comment:agent -- \
  --project trello-lean-canvas-7kvrv \
  --owner OWNER_UID --canvas CANVAS_ID --card TASK_ID \
  --id review-run-123 --name 'Review agent'
```

The tool returns `{"id":"review-run-123","duplicate":false}` (or `true` for an already-acknowledged identical post). The Firestore REST API verifies the ID token and enforces the same security rules as the UI. Atomic conditional commits check the board update time; concurrent changes are retried. Failure leaves a nonzero exit code. A timeout can have an ambiguous outcome: retry **with the same ID and body**. `FIRESTORE_EMULATOR_HOST` is supported only on loopback for isolated testing.

## Isolated Boat preview

```bash
npm run build:comments-preview
npm run preview:comments
# On the Boat host: host 4173 --public
```

This builds a **separate entry point** in `preview/` to `dist-preview/`. It starts with a synthetic task and agent comment. New user comments persist only in that browser's localStorage; the preview is not connected to production Firebase and requires no sign-in. Agent authentication/REST writes are validated by the emulator tests, not this local-storage demo. Production login checks and the loopback-only test bypass are unchanged. Never publish this demo build to the production hostname.

Test the preview by adding a comment, refreshing the task URL, closing/reopening the task, and checking the User/Agent labels. Try multiline text and HTML-like text (displayed literally). Preview availability lasts only while its Boat sandbox is running.

## Release and validation

1. Deploy `firestore.rules` first; it still accepts historical untyped user comments.
2. Deploy the production frontend (not `dist-preview`) through the normal approved release process. Older clients with strict schemas must reload before they can read new attributed comments.
3. Provision an approved, project-scoped agent identity and verify real ID-token posting with a test task.

This PR does not deploy production rules, provision real agents, change Firebase authorized domains, or alter production tasks.

Coverage includes legacy schemas, chronology, idempotence, concurrent user/agent appends, author spoofing, cross-owner/project access, malformed writes, deleted tasks, real REST + CLI posting against the emulator, mobile rendering, persistence, and existing failed-save draft recovery.
