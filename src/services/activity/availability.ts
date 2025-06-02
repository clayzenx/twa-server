// services/activity/availability.ts
import { prisma } from '../../db'
import type { Activity } from './definitions'
import { conditionalHandlers } from './handlers'

/**
 * Result of conditional availability check.
 */
export interface AvailabilityResult {
  available: boolean
  nextAvailableAt?: Date
  reason?: string
}

/**
 * Checks if the given activity is available for the user.
 * @param userId ID of the user
 * @param activity Activity definition
 * @param args Optional parameters for conditional checks
 */
export async function canPerformActivity(
  userId: number,
  activity: Activity,
  args?: Record<string, any>
): Promise<AvailabilityResult> {
  const now = new Date()
  switch (activity.availability) {
    case 'once': {
      const count = await prisma.userActivity.count({
        where: { userId, activityId: activity.id }
      })
      if (count === 0) {
        return { available: true }
      }
      return { available: false, reason: 'Activity already performed' }
    }
    case 'daily': {
      // calculate start of day in UTC
      const startOfDay = new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0,0,0,0
      ))
      const record = await prisma.userActivity.findFirst({
        where: { userId, activityId: activity.id, consumedAt: { gte: startOfDay } },
        orderBy: { consumedAt: 'desc' }
      })
      if (record) {
        const nextAvailableAt = new Date(startOfDay)
        nextAvailableAt.setUTCDate(nextAvailableAt.getUTCDate() + 1)
        return { available: false, nextAvailableAt, reason: 'Activity already claimed today' }
      }
      return { available: true }
    }
    case 'conditional': {
      const handler = conditionalHandlers[activity.id]
      if (handler) {
        return handler(userId, args)
      }
      // fallback: once
      const count = await prisma.userActivity.count({
        where: { userId, activityId: activity.id }
      })
      return { available: count === 0 }
    }
  }
}