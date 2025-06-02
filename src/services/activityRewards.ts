import { getActivityById } from './activity'
import { canPerformActivity, recordActivity } from './userActivity'
import { incrementUserBalance, getUserByTelegramId, setUserReferredBy } from './user'
import type { User } from '@prisma/client'
import type { Activity } from './activity'

/**
 * Error thrown when an activity is not available for the user.
 */
export class ActivityUnavailableError extends Error {
  public nextAvailableAt?: Date
  constructor(reason?: string, nextAvailableAt?: Date) {
    // Ensure message is never empty
    super(reason || 'Activity not available')
    this.name = 'ActivityUnavailableError'
    this.nextAvailableAt = nextAvailableAt
  }
}

/**
 * Error thrown when an activity ID is invalid.
 */
export class ActivityNotFoundError extends Error {
  constructor(activityId: string) {
    super(`Activity not found: ${activityId}`)
    this.name = 'ActivityNotFoundError'
  }
}

/**
 * Reward handler signature for custom side-effects after rewarding.
 */
type RewardHandler = (params: {
  userId: number
  activity: Activity
  args?: Record<string, any>
  userAfterBalance: User
}) => Promise<User | void>

/**
 * Referral reward handler: sets up the referral relationship.
 */
const referralRewardHandler: RewardHandler = async ({ userId, args, userAfterBalance }) => {
  const refCode = args?.referrerTelegramId + ''
  if (!refCode) return userAfterBalance
  const refUser = await getUserByTelegramId(refCode)
  if (!refUser) return userAfterBalance
  // Link referredBy for this user
  return setUserReferredBy(userId, refUser.id)
}

/**
 * Map of activity ID to optional reward-side effect handler.
 */
const rewardHandlers: Record<string, RewardHandler> = {
  referral: referralRewardHandler,
}

/**
 * Processes rewarding an activity for a user: checks availability, records activity,
 * increments balance, applies custom reward handlers, and returns final state.
 * @returns user after all updates, activity object, and new availability state
 */
export async function rewardActivity(
  userId: number,
  activityId: string,
  args?: Record<string, any>
): Promise<{ user: User; activity: Activity; availability: { available: boolean; nextAvailableAt?: Date; reason?: string } }> {
  const activity = getActivityById(activityId)
  if (!activity) throw new ActivityNotFoundError(activityId)

  // Check availability
  const { available, nextAvailableAt, reason } = await canPerformActivity(userId, activity, args)
  if (!available) {
    throw new ActivityUnavailableError(reason, nextAvailableAt)
  }

  // Record the activity
  await recordActivity(userId, activityId, args)

  // Increment balance
  let userAfterBalance = await incrementUserBalance(userId, activity.reward)

  // Custom side effects per activity
  const handler = rewardHandlers[activityId]
  if (handler) {
    const result = await handler({ userId, activity, args, userAfterBalance })
    if (result) {
      userAfterBalance = result
    }
  }

  // Re-check availability for response
  const availability = await canPerformActivity(userId, activity)

  return { user: userAfterBalance, activity, availability }
}
