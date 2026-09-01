import { useState } from 'react'

export function useNotice() {
  const [notice, setNotice] = useState('')
  const notify = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2200)
  }
  return { notice, notify }
}
