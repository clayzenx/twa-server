// services/activity/handlers.ts
import { prisma } from '../../db'
import type { AvailabilityResult } from './availability'

/**
 * Handler signature for conditional activities.
 */
export type ConditionalHandler = (
  userId: number,
  args?: Record<string, any>
) => Promise<AvailabilityResult>

/**
 * Referral activity availability handler. Expects args.referrerTelegramId.
 */
export const referralHandler: ConditionalHandler = async (userId, args) => {
  const codeRaw = args?.referrerTelegramId
  const code = codeRaw != null ? String(codeRaw) : ''
  if (!code) {
    return { available: false, reason: 'Missing referral code' }
  }
  // Current user
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { available: false, reason: 'User not found' }
  if (user.telegramId === code) {
    return { available: false, reason: 'Cannot refer yourself' }
  }
  // Referrer must exist
  const refUser = await prisma.user.findUnique({ where: { telegramId: code } })
  if (!refUser) {
    return { available: false, reason: 'Invalid referral code' }
  }
  // Ensure not used
  const count = await prisma.userActivity.count({ where: { userId, activityId: 'referral' } })
  if (count > 0) {
    return { available: false, reason: 'Referral already used' }
  }
  return { available: true }
}

/**
 * Map of activity ID to availability handlers.
 */
export const conditionalHandlers: Record<string, ConditionalHandler> = {
  referral: referralHandler,
}