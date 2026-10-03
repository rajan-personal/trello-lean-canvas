import { doc, type Firestore, type Transaction } from 'firebase/firestore'

/** Separate from card payloads so old editors cannot overwrite the deletion guard. */
export async function childCountChange(tx: Transaction, db: Firestore, path: string,
  parentId: string, childId: string, delta: 1 | -1) {
  const ref = doc(db, `${path}/childCounts`, parentId)
  const current = await tx.get(ref)
  const count: unknown = current.exists() ? current.data().count : 0
  if (typeof count !== 'number' || !Number.isSafeInteger(count) || count + delta < 0)
    throw new Error('Invalid child count. Reload and retry your change.')
  // Return the write so callers can finish all transaction reads first.
  return () => tx.set(ref, { count: count + delta, childId })
}
