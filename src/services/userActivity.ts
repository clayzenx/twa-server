import { prisma } from '../db'
import type { Activity } from './activity'

/**
 * Records that a user has consumed an activity reward.
 */
export async function recordActivity(userId: number, activityId: string) {
  return prisma.userActivity.create({
    data: { userId, activityId },
  })
}

/**
 * Checks if the given activity is available for the user, returning
 * availability status and (if not available) the next timestamp it will unlock.
 */
export async function canPerformActivity(
  userId: number,
  activity: Activity
): Promise<{ available: boolean; nextAvailableAt?: Date }> {
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
      // implement custom condition logic here
      return { available: true }
    }
    default:
      return { available: false }
  }
}
