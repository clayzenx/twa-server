import { prisma } from '../db'
import type { User } from '@prisma/client'
import type { TelegramUser } from '../types/telegram'

/**
 * Finds a user by Telegram ID.
 * @param telegramId string ID from Telegram
 * @returns Prisma User or null
 */
export async function getUserByTelegramId(telegramId: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { telegramId },
    include: {
      // Users referred by this user
      referrals: true,
      // The user who referred this user (if any)
      referredBy: true,
    },
  })
}
/**
 * Set the referrer for a user (self-referral relationship).
 * @param userId ID of the user being referred
 * @param referrerId ID of the user who referred
 * @returns Updated User record
 */
export async function setUserReferredBy(userId: number, referrerId: number): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: { referredById: referrerId },
    include: {
      referrals: true,
      referredBy: true,
    },
  })
}

/**
 * Atomically increments the user's balance by the specified amount.
 */
export async function incrementUserBalance(userId: number, amount: number): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: { balance: { increment: amount } },
  })
}
/**
 * Upserts a Telegram user record, updating profile fields on every login.
 */
export async function upsertTelegramUser(tgUser: TelegramUser): Promise<User> {
  return prisma.user.upsert({
    where: { telegramId: tgUser.id.toString() },
    update: {
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      username: tgUser.username,
      languageCode: tgUser.language_code,
      photoUrl: tgUser.photo_url,
    },
    create: {
      telegramId: tgUser.id.toString(),
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      username: tgUser.username,
      languageCode: tgUser.language_code,
      photoUrl: tgUser.photo_url,
    },
    include: {
      referrals: true,
      referredBy: true,
    },
  })
}
