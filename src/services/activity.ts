export type AvailabilityType = 'once' | 'daily' | 'conditional';

/**
 * Describes a rewardable activity and its availability rule.
 */
export interface Activity {
  id: string;
  name: string;
  reward: number;
  availability: AvailabilityType;
}

// Define all activities and their rules here
export const ACTIVITIES: Activity[] = [
  { id: 'welcome', name: 'Welcome bonus', reward: 10, availability: 'once' },
  { id: 'daily_login', name: 'Daily Login Bonus', reward: 5, availability: 'daily' },
  { id: 'referral', name: 'Referral bonus', reward: 20, availability: 'conditional' },
  // Add more activities with appropriate availability ('once' | 'daily' | 'conditional')
];

/**
 * Returns all defined activities.
 */
export function getAvailableActivities(): Activity[] {
  return ACTIVITIES;
}

/**
 * Finds an activity by its internal id.
 */
export function getActivityById(id: string): Activity | undefined {
  return ACTIVITIES.find(a => a.id === id);
}