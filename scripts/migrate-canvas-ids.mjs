#!/usr/bin/env node
import process from 'node:process'
import { constants } from 'node:fs'
import { open, realpath, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { check, target } from './canvas-uuid/schema.mjs'
import { createPlan, validatePlan, applyPlan, buildWrites, MAX_PLAN_BYTES } from './canvas-uuid/plan.mjs'
import { FirestoreRest } from './canvas-uuid/rest.mjs'

export const usage = 'node scripts/migrate-canvas-ids.mjs --project PROJECT --uid UID [--database "(default)"] --plan /private/outside-repo/plan.json --access-token-stdin [--apply --confirm-writers-paused]'
export function parseArgs(args) {
  const values = {}, flags = new Set()
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    check(!Object.hasOwn(values, arg) && !flags.has(arg), 'Duplicate CLI option')
    if (['--apply', '--access-token-stdin', '--confirm-writers-paused', '--help'].includes(arg)) flags.add(arg)
    else {
      check(['--project', '--uid', '--database', '--plan'].includes(arg) && args[i + 1] && !args[i + 1].startsWith('--'), 'Unknown/missing CLI option')
      values[arg] = args[++i]
    }
  }
  if (flags.has('--help')) return { help: true }
  const config = { project: values['--project'], uid: values['--uid'], database: values['--database'] ?? '(default)', workspace: 'default' }
  target(config)
  check(values['--plan'] && path.isAbsolute(values['--plan']) && flags.has('--access-token-stdin'), 'Explicit absolute --plan and --access-token-stdin required')
  check(!flags.has('--apply') || flags.has('--confirm-writers-paused'), 'Apply requires --confirm-writers-paused (operator attestation, not an automatic lock)')
  return { config, planPath: values['--plan'], apply: flags.has('--apply') }
}
export async function privatePlanPath(planPath) {
  const parent = await realpath(path.dirname(planPath))
  const repo = await realpath(fileURLToPath(new globalThis.URL('..', import.meta.url)))
  check(parent !== repo && !parent.startsWith(`${repo}${path.sep}`), 'Backup must be outside the repository')
  const info = await stat(parent)
  check(info.isDirectory() && (info.mode & 0o077) === 0 && info.uid === process.getuid(), 'Plan parent must be an operator-owned private directory (chmod 700)')
  return path.join(parent, path.basename(planPath))
}
export async function writePlan(planPath, plan) {
  const destination = await privatePlanPath(planPath)
  const file = await open(destination, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600)
  try {
    await file.writeFile(`${JSON.stringify(plan)}\n`, 'utf8')
    await file.sync()
  } finally { await file.close() }
  const directory = await open(path.dirname(destination), constants.O_RDONLY)
  try { await directory.sync() } finally { await directory.close() }
}
export async function readPlan(planPath, config) {
  const file = await open(await privatePlanPath(planPath), constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const info = await file.stat()
    check(info.isFile() && info.uid === process.getuid() && (info.mode & 0o077) === 0 && info.nlink === 1 && info.size <= MAX_PLAN_BYTES, 'Plan file must be private, bounded, regular, operator-owned, and not hard-linked')
    let plan
    try { plan = JSON.parse(await file.readFile('utf8')) } catch { throw new Error('Invalid plan JSON; original backup must not be modified') }
    return validatePlan(plan, config)
  } finally { await file.close() }
}
async function readToken() {
  check(!process.stdin.isTTY, 'Pipe the IAM OAuth access token through stdin')
  let token = ''
  for await (const chunk of process.stdin) { token += chunk; check(token.length < 16384, 'Access token input exceeds limit') }
  return token.trim()
}
export async function main(args = process.argv.slice(2)) {
  const options = parseArgs(args)
  if (options.help) { process.stdout.write(`${usage}\n`); return }
  await privatePlanPath(options.planPath)
  const plan = options.apply ? await readPlan(options.planPath, options.config) : undefined
  const client = new FirestoreRest(options.config, await readToken())
  if (options.apply) {
    process.stdout.write(`Migration result: ${await applyPlan(client, plan)}. No document content logged.\n`)
  } else {
    const next = createPlan(options.config, await client.snapshot())
    await writePlan(options.planPath, next)
    process.stdout.write(`Dry-run only: ${Object.keys(next.mapping).length} IDs, ${buildWrites(next).length} atomic writes. Private immutable plan/backup created; no Firestore writes.\n`)
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    // Native fs errors contain paths, never document bodies or bearer tokens.
    process.stderr.write(`Migration stopped: ${error.message}\n`)
    process.exitCode = 1
  })
}
