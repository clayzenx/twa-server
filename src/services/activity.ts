import jwt, { JwtPayload } from 'jsonwebtoken'

export interface Activity {
  id: string
  name: string
  reward: number
}

// List of available activities
const ACTIVITIES: Activity[] = [
  { id: 'welcome', name: 'Welcome bonus', reward: 10 },
  // Add more activities here as needed
]

/**
 * Returns all defined activities.
 */
export function getAvailableActivities(): Activity[] {
  return ACTIVITIES
}

/**
 * Finds an activity by its internal id.
 */
export function getActivityById(id: string): Activity | undefined {
  return ACTIVITIES.find(a => a.id === id)
}

// Use ACTIVITY_SECRET if set, otherwise fallback to JWT_SECRET
const ACTIVITY_SECRET = process.env.ACTIVITY_SECRET || process.env.JWT_SECRET!

/**
 * Encodes an activity id into a time-limited token to prevent tampering.
 */
export function encodeActivityToken(activityId: string): string {
  return jwt.sign({ activityId }, ACTIVITY_SECRET, { expiresIn: '30d' })
}

/**
 * Decodes the provided token and extracts the activity id.
 * Throws on invalid or expired token.
 */
export function decodeActivityToken(token: string): string {
  const payload = jwt.verify(token, ACTIVITY_SECRET) as JwtPayload & { activityId?: string }
  if (!payload.activityId || typeof payload.activityId !== 'string') {
    throw new Error('Invalid activity token payload')
  }
  return payload.activityId
}