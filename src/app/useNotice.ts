import { useEffect, useRef, useState } from 'react'

export function useNotice() {
  const [notice, setNotice] = useState('')
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const notify = (message: string) => {
    window.clearTimeout(timer.current)
    setNotice(message)
    timer.current = window.setTimeout(() => setNotice(''), 2200)
  }
  return { notice, notify }
}
