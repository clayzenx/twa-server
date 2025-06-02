// services/activity/definitions.ts
// Defines available activities and lookup helpers

/**
 * Availability rules: 'once', 'daily', or 'conditional' for custom logic
 */
export type AvailabilityType = 'once' | 'daily' | 'conditional'

/**
 * Describes a rewardable activity and its availability rule.
 */
export interface Activity {
  id: string
  name: string
  reward: number
  availability: AvailabilityType
}

// Define all activities and their rules here
export const ACTIVITIES: Activity[] = [
  { id: 'welcome', name: 'Welcome bonus', reward: 10, availability: 'once' },
  { id: 'daily_login', name: 'Daily Login Bonus', reward: 5, availability: 'daily' },
  { id: 'referral', name: 'Referral bonus', reward: 20, availability: 'conditional' },
  // Add more activities as needed
]

/**
 * Returns all defined activities.
 */
export function getAvailableActivities(): Activity[] {
  return ACTIVITIES
}

/**
 * Finds an activity by its internal id.
 * @param id internal activity identifier
 */
export function getActivityById(id: string): Activity | undefined {
  return ACTIVITIES.find(a => a.id === id)
}