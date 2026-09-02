import { execFileSync, spawnSync } from 'node:child_process'
import process from 'node:process'

const env = { ...process.env }
if (process.platform === 'darwin') {
  try {
    const javaHome = execFileSync('/usr/libexec/java_home', {
      encoding: 'utf8',
    }).trim()
    env.JAVA_HOME = javaHome
    env.PATH = `${javaHome}/bin:${env.PATH ?? ''}`
  } catch {
    // Firebase CLI will print its standard Java requirement if none is installed.
  }
}

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const result = spawnSync(
  command,
  [
    '-y',
    'firebase-tools@15.28.2',
    'emulators:exec',
    '--only',
    'firestore',
    'vitest run --config vitest.emulator.config.ts',
  ],
  { env, stdio: 'inherit' },
)

process.exit(result.status ?? 1)
