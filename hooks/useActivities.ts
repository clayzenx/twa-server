import { useState, useEffect, useCallback } from 'react'

// Activity type matching backend response
export type AvailabilityType = 'once' | 'daily' | 'conditional'

export interface Activity {
  id: string
  name: string
  reward: number
  availability: AvailabilityType
  available: boolean
  nextAvailableAt?: string
}

export interface UseActivitiesResult {
  activities: Activity[]
  loading: boolean
  error: string | null
  /** Manually re-fetch activities */
  refresh: () => void
  /** Attempt to reward the given activity id */
  rewardActivity: (id: string) => Promise<void>
}

/**
 * React hook to fetch and manage user activities with availability rules.
 * @param token JWT token for authorization
 */
export function useActivities(token: string): UseActivitiesResult {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/activities', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `Error ${res.status}`)
      }
      const data = await res.json()
      setActivities(data.activities)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  const rewardActivity = useCallback(
    async (id: string) => {
      try {
        const res = await fetch('/activities/reward', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || `Error ${res.status}`)
        }
        // Update only the rewarded activity's availability
        if (data.availability) {
          setActivities(prev =>
            prev.map(act =>
              act.id === id
                ? { ...act, available: data.availability.available, nextAvailableAt: data.availability.nextAvailableAt }
                : act
            )
          )
        }
      } catch (e: any) {
        throw e
      }
    },
    [token]
  )

  useEffect(() => {
    if (token) fetchActivities()
  }, [token, fetchActivities])

  // Optional: refresh availability periodically (e.g., every minute)
  useEffect(() => {
    const timer = setInterval(fetchActivities, 60000)
    return () => clearInterval(timer)
  }, [fetchActivities])

  return { activities, loading, error, refresh: fetchActivities, rewardActivity }
}
