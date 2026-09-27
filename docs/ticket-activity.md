# Seven-day project activity

The `/tickets` list shows seven contribution squares per project, oldest first and today last. Open the heatmap by click, tap, or keyboard for exact daily counts. Dates use Indian Standard Time (Asia/Kolkata, UTC+05:30) so different clients share the same buckets, rolling over at midnight IST. The row shows only squares; period and timezone remain available in the accessible label and expanded breakdown. The view refreshes its date on focus and once a minute.

Each successfully persisted ticket creation, edit (including estimates), move, or deletion contributes one change. Reads, unchanged saves, column management, comments, and imports do not create activity. Deletion recovery records the change once when deletion completes. Failed writes cannot leave an activity-only update.

History is a bounded `activity: { timeZone: 'Asia/Kolkata', throughDay, counts }` record with seven nonnegative integer counts. Local boards store it alongside cards in the same write. Firestore stores it on the board document in the same revision transaction as the ticket change; summary reads require no additional collections. Old documents without activity remain valid. Imports/exports preserve recorded history when present, without synthesizing events.

Empty squares mean no **recorded** changes, not a reconstructed historical claim. There is no backfill. Legacy UTC aggregates (records without `timeZone`) remain readable but are not displayed as IST counts: without event timestamps they cannot be accurately converted. The next recorded change starts a fresh IST window. Loading or failed summaries use dashed squares and an unavailable explanation instead of showing zero activity. Levels are 0, 1–2, 3–5, 6–9, and 10+ changes.

## Deployment

Deploy the updated Firestore rules before deploying the frontend. The rules now permit and validate optional activity records; old rules reject writes containing this field. Clients need the updated board schema to read documents containing activity.
