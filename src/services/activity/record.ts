// services/activity/record.ts
import { prisma } from '../../db'

/**
 * Records that a user has consumed an activity reward.
 * @param userId ID of the user
 * @param activityId ID of the activity
 * @param meta Optional metadata for the activity
 */
export async function recordActivity(
  userId: number,
  activityId: string,
  meta?: Record<string, any>
): Promise<void> {
  await prisma.userActivity.create({ data: { userId, activityId, meta } })
}