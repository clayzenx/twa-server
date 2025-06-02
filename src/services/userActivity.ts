import { prisma } from '../db'
import type { Activity } from './activity'
import { conditionalHandlers } from './userActivityHandlers'

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
      if (count === 0) {
        return { available: true }
      }
      return { available: false, reason: 'Activity already performed' }
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
        return { available: false, nextAvailableAt, reason: 'Activity already claimed today' }
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
