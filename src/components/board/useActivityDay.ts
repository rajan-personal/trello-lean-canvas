import { useEffect, useState } from 'react'
import { activityDay } from '../../data/board-activity'

export function useActivityDay() {
  const [day, setDay] = useState(activityDay)
  useEffect(() => {
    const refresh = () => setDay(activityDay())
    const timer = window.setInterval(refresh, 60_000)
    window.addEventListener('focus', refresh)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [])
  return day
}
