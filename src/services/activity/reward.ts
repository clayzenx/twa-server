// services/activity/reward.ts
import type { Activity } from './definitions'
import { getActivityById } from './definitions'
import { canPerformActivity } from './availability'
import { recordActivity } from './record'
import { incrementUserBalance, getUserByTelegramId, setUserReferredBy } from '../user'
import type { User } from '@prisma/client'

/**
 * Error for when an activity isn't available.
 */
export class ActivityUnavailableError extends Error {
  public nextAvailableAt?: Date
  constructor(reason?: string, nextAvailableAt?: Date) {
    super(reason || 'Activity not available')
    this.name = 'ActivityUnavailableError'
    this.nextAvailableAt = nextAvailableAt
  }
}

/**
 * Error for an invalid activity ID.
 */
export class ActivityNotFoundError extends Error {
  constructor(activityId: string) {
    super(`Activity not found: ${activityId}`)
    this.name = 'ActivityNotFoundError'
  }
}

/**
 * Side-effect handler for referral rewards.
 */
async function handleReferralReward(
  userId: number,
  args?: Record<string, any>
): Promise<User> {
  const codeRaw = args?.referrerTelegramId
  const code = codeRaw != null ? String(codeRaw) : ''
  if (!code) return null as any
  const refUser = await getUserByTelegramId(code)
  if (!refUser) return null as any
  return setUserReferredBy(userId, refUser.id)
}

/**
 * Mapping of activity ID to reward side-effect.
 */
const rewardHandlers: Record<string, typeof handleReferralReward> = {
  referral: handleReferralReward,
}

/**
 * Processes an activity reward for a user.
 */
export async function rewardActivity(
  userId: number,
  activityId: string,
  args?: Record<string, any>
): Promise<{ user: User; activity: Activity; availability: any }> {
  const activity = getActivityById(activityId)
  if (!activity) throw new ActivityNotFoundError(activityId)
  const { available, nextAvailableAt, reason } = await canPerformActivity(userId, activity, args)
  if (!available) throw new ActivityUnavailableError(reason, nextAvailableAt)
  await recordActivity(userId, activityId, args)
  let user = await incrementUserBalance(userId, activity.reward)
  const handler = rewardHandlers[activityId]
  if (handler) {
    const result = await handler(userId, args)
    if (result) user = result
  }
  const availability = await canPerformActivity(userId, activity)
  return { user, activity, availability }
}