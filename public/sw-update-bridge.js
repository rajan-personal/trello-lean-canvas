const updateProbe = 'lean:pwa-update-probe'
const promptReady = 'lean:pwa-prompt-ready'
const readyClients = new Set()
const pause = (duration) => new Promise((resolve) => globalThis.setTimeout(resolve, duration))

globalThis.addEventListener('message', (event) => {
  if (event.data?.type === promptReady && event.source?.id)
    readyClients.add(event.source.id)
})

globalThis.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const windows = await globalThis.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    })
    if (!windows.length) return
    for (let attempt = 0; attempt < 4; attempt += 1) {
      for (const client of windows) client.postMessage({ type: updateProbe })
      await pause(250)
    }
    // Releases before the prompt did not know how to activate a waiting worker.
    // Upgrade those clients automatically once so they cannot remain stranded.
    if (windows.some((client) => !readyClients.has(client.id)))
      await globalThis.skipWaiting()
  })())
})
