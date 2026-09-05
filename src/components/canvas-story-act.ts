import { act } from 'react'

/** Await React's work across an interaction, restoring the caller's test environment. */
export async function canvasStoryAct(action: () => void | Promise<void>) {
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
  const previous = environment.IS_REACT_ACT_ENVIRONMENT
  environment.IS_REACT_ACT_ENVIRONMENT = true
  try {
    await act(action)
  } finally {
    if (previous === undefined) delete environment.IS_REACT_ACT_ENVIRONMENT
    else environment.IS_REACT_ACT_ENVIRONMENT = previous
  }
}
