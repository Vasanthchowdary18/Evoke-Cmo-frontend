import { useState, useEffect } from 'react'
import { useAuth } from './useAuth.js'
import { getUserData } from '../services/userService'

/**
 * Returns the current user's plan from Firestore.
 * Defaults to 'free' if not set.
 */
const TRIAL_DAYS = 14

export function useUserPlan() {
  const { user } = useAuth()
  const [plan, setPlan]       = useState('free')
  const [trialDaysLeft, setTrialDaysLeft] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return }
    getUserData(user.uid).then(data => {
      setPlan(data?.userPlan || data?.selectedPlan || 'free')
      const startedAt = data?.trialStartedAt?.toDate ? data.trialStartedAt.toDate() : null
      if (startedAt) {
        const daysElapsed = Math.floor((Date.now() - startedAt.getTime()) / (1000 * 60 * 60 * 24))
        setTrialDaysLeft(Math.max(0, TRIAL_DAYS - daysElapsed))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user?.uid])

  return { plan, loading, trialDaysLeft }
}
