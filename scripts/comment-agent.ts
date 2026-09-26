import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'
import { z } from 'zod'

const segment = z.string().min(1).max(1500).refine((s) => !s.includes('/') && s !== '.' && s !== '..')
const inputSchema = z.object({
  project: z.string().regex(/^[a-z][a-z0-9-]+$/), owner: segment, canvas: segment, card: segment,
  id: segment, name: z.string().trim().min(1).max(500), text: z.string().trim().min(1).max(10000),
})
type CommentInput = z.infer<typeof inputSchema>
type Value = { stringValue?: string; integerValue?: string }
type Document = { name: string; updateTime: string; fields: Record<string, Value> }
class ApiError extends Error {
  readonly status: number
  constructor(status: number) {
    super(`Firestore request failed (${status}). Check token, permissions and task IDs.`)
    this.status = status
  }
}

// Only Firebase ID tokens: REST enforces Firestore rules, unlike Admin SDK writes.
export async function postAgentComment(input: CommentInput, token: string, emulatorHost?: string) {
  const value = inputSchema.parse(input)
  if (!token) throw new Error('FIREBASE_ID_TOKEN is required.')
  const claims = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString()) as { sub?: string; aud?: string }
  const authorId = segment.parse(claims.sub) // Attribution only; Firebase verifies the token.
  if (claims.aud !== value.project) throw new Error('Token is for a different Firebase project.')
  if (emulatorHost && !/^(127\.0\.0\.1|localhost):\d+$/.test(emulatorHost))
    throw new Error('The emulator must be on loopback; never send tokens to an arbitrary host.')
  const origin = emulatorHost ? `http://${emulatorHost}` : 'https://firestore.googleapis.com'
  const root = `projects/${value.project}/databases/(default)/documents`
  const board = `${root}/users/${value.owner}/workspaces/default/canvases/${value.canvas}/boards/default`
  const comment = `${board}/comments/${value.id}`
  const request = async (path: string, body?: unknown) => {
    const encoded = path.split('/').map((part) => encodeURIComponent(part).replaceAll('%3A', ':')).join('/')
    const response = await fetch(`${origin}/v1/${encoded}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(30000),
    })
    if (!response.ok) throw new ApiError(response.status)
    return response.json()
  }
  const strings = { canvasId: value.canvas, cardId: value.card, authorId, authorName: value.name,
    authorType: 'agent', text: value.text }
  await request(`${board}/cards/${value.card}`)
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await request(board) as Document
    if (current.fields.status?.stringValue !== 'active') throw new Error('Board is not active. Retry after recovery.')
    let existing: Document | undefined
    try { existing = await request(comment) as Document }
    catch (error) { if (!(error instanceof ApiError && error.status === 404)) throw error }
    if (existing) {
      if (!Object.entries(strings).every(([key, text]) => existing!.fields[key]?.stringValue === text))
        throw new Error('Comment id already used for different content. Choose a new --id for a new comment.')
      return { id: value.id, duplicate: true }
    }
    const revision = Number(current.fields.revision?.integerValue)
    if (!Number.isSafeInteger(revision) || revision < 1) throw new Error('Invalid board revision.')
    const timestamp = [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }]
    try {
      // Atomic conditional commit: updateTime is an optimistic concurrency check.
      await request(`${root}:commit`, { writes: [
        { update: { name: board, fields: { revision: { integerValue: String(revision + 1) } } },
          updateMask: { fieldPaths: ['revision'] }, updateTransforms: timestamp, currentDocument: { updateTime: current.updateTime } },
        { update: { name: comment, fields: { schemaVersion: { integerValue: '1' },
          ...Object.fromEntries(Object.entries({ ...strings, createdAt: new Date().toISOString() })
            .map(([key, text]) => [key, { stringValue: text }])) } },
          updateTransforms: timestamp, currentDocument: { exists: false } },
      ] })
      return { id: value.id, duplicate: false }
    } catch (error) {
      if (!(error instanceof ApiError) || attempt === 4) throw error
      if (error.status === 403) {
        const fresh = await request(board) as Document
        if (fresh.updateTime === current.updateTime) throw error
      } else if (![409, 412, 429, 503].includes(error.status)) throw error
      await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** attempt))
    }
  }
  throw new Error('Comment could not be posted. Retry with the same --id.')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { values } = parseArgs({ options: Object.fromEntries(
      ['project', 'owner', 'canvas', 'card', 'id', 'name'].map((name) => [name, { type: 'string' as const }])) })
    const chunks: Buffer[] = []
    for await (const chunk of process.stdin) {
      chunks.push(Buffer.from(chunk))
      if (chunks.reduce((total, part) => total + part.length, 0) > 40000) throw new Error('Comment is too long.')
    }
    const input = inputSchema.parse({ ...values, text: Buffer.concat(chunks).toString('utf8') })
    console.log(JSON.stringify(await postAgentComment(input, process.env.FIREBASE_ID_TOKEN ?? '', process.env.FIRESTORE_EMULATOR_HOST)))
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Could not post comment.')
    process.exitCode = 1
  }
}
