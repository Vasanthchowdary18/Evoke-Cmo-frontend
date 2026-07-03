import { useState, useEffect } from 'react'
import { useAuth } from './useAuth.js'
import { getUserData } from '../services/userService'

/**
 * Returns the current user's plan from Firestore.
 * Defaults to 'free' if not set.
 */
export function useUserPlan() {
  const { user } = useAuth()
  const [plan, setPlan]       = useState('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return }
    getUserData(user.uid).then(data => {
      setPlan(data?.userPlan || 'free')
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user?.uid])

  return { plan, loading }
}
