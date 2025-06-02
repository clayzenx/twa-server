import { prisma } from '../db'

/**
 * Result of conditional availability check for activities.
 */
export interface ConditionalResult {
  available: boolean
  nextAvailableAt?: Date
  reason?: string
}

/**
 * Handler signature for conditional activities.
 */
export type ConditionalHandler = (
  userId: number,
  args?: Record<string, any>
) => Promise<ConditionalResult>

/**
 * Referral activity handler. Expects args.referrerTelegramId = string.
 * Validates the referral code and ensures one-time use.
 */
export const referralHandler: ConditionalHandler = async (
  userId: number,
  args?: Record<string, any>
) => {
  const code = args?.referrerTelegramId + ''
  if (!code || typeof code !== 'string') {
    return { available: false, reason: 'Missing referral code' }
  }
  // Fetch current user
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return { available: false, reason: 'User not found' }
  }
  // Prevent self-referral
  if (user.telegramId === code) {
    return { available: false, reason: 'Cannot refer yourself' }
  }
  // Fetch referrer by Telegram ID
  const refUser = await prisma.user.findUnique({ where: { telegramId: code } })
  if (!refUser) {
    return { available: false, reason: 'Invalid referral code' }
  }
  // Check if already used
  const count = await prisma.userActivity.count({
    where: { userId, activityId: 'referral' },
  })
  if (count > 0) {
    return { available: false, reason: 'Referral already used' }
  }
  return { available: true }
}

/**
 * Mapping of activity ID to custom conditional handler.
 */
export const conditionalHandlers: Record<string, ConditionalHandler> = {
  referral: referralHandler,
}
