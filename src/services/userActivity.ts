import { prisma } from '../db'
import type { Activity } from './activity'

// Result of conditional availability check
interface ConditionalResult {
  available: boolean
  nextAvailableAt?: Date
  reason?: string
}

// Handler signature for conditional activities
type ConditionalHandler = (
  userId: number,
  args?: Record<string, any>
) => Promise<ConditionalResult>

/**
 * Map of activity.id to custom conditional checking logic.
 */
const conditionalHandlers: Record<string, ConditionalHandler> = {
  // Referral: user provides referrerTelegramId as string
  referral: async (userId, args) => {
    // must provide referrerTelegramId
    const code = args?.referrerTelegramId + ''

    console.log('code', code, typeof code);

    if (!code || typeof code !== 'string') {
      return { available: false, reason: 'Missing referral code' }
    }
    // current user record to get their telegramId
    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      return { available: false, reason: 'User not found' }
    }
    // cannot refer yourself
    if (user.telegramId === code) {
      return { available: false, reason: 'Cannot refer yourself' }
    }
    // referrer must exist
    const refUser = await prisma.user.findUnique({ where: { telegramId: code } })
    if (!refUser) {
      return { available: false, reason: 'Invalid referral code' }
    }

    // ensure user has not already used referral
    const count = await prisma.userActivity.count({
      where: { userId, activityId: 'referral' },
    })
    if (count > 0) {
      return { available: false, reason: 'Referral already used' }
    }
    return { available: true }
  },
}

/**
 * Records that a user has consumed an activity reward.
 */
/**
 * Records that a user has consumed an activity reward, with optional metadata.
 */
export async function recordActivity(
  userId: number,
  activityId: string,
  meta?: Record<string, any>
) {
  return prisma.userActivity.create({
    data: { userId, activityId, meta },
  })
}

/**
 * Checks if the given activity is available for the user, returning
 * availability status and (if not available) the next timestamp it will unlock.
 */
/**
 * Checks if the given activity is available for the user, returning
 * availability status, optional next timestamp, and reason for unavailability.
 * @param args Optional parameters for conditional availability checks
 */
export async function canPerformActivity(
  userId: number,
  activity: Activity,
  args?: Record<string, any>
): Promise<{ available: boolean; nextAvailableAt?: Date; reason?: string }> {
  const now = new Date()
  switch (activity.availability) {
    case 'once': {
      const count = await prisma.userActivity.count({
        where: { userId, activityId: activity.id },
      })
      return { available: count === 0 }
    }
    case 'daily': {
      // calculate start of day in UTC
      const startOfDay = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0, 0, 0, 0
      ))
      const record = await prisma.userActivity.findFirst({
        where: {
          userId,
          activityId: activity.id,
          consumedAt: { gte: startOfDay },
        },
        orderBy: { consumedAt: 'desc' },
      })
      if (record) {
        // next available is tomorrow at UTC midnight
        const nextAvailableAt = new Date(startOfDay)
        nextAvailableAt.setUTCDate(nextAvailableAt.getUTCDate() + 1)
        return { available: false, nextAvailableAt }
      }
      return { available: true }
    }
    case 'conditional': {
      // custom conditional handlers per activity
      const handler = conditionalHandlers[activity.id]
      if (handler) {
        return handler(userId, args)
      }
      // fallback: allow once if not yet consumed
      const count = await prisma.userActivity.count({
        where: { userId, activityId: activity.id },
      })
      return { available: count === 0 }
    }
    default:
      return { available: false }
  }
}
