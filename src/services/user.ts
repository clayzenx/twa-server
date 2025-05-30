import { prisma } from '../db'
import type { User } from '@prisma/client'
import type { TelegramUser } from '../types/telegram'

export async function getUserByTelegramId(telegramId: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { telegramId } })
}

export async function createUser(telegramId: string): Promise<User> {
  return prisma.user.create({ data: { telegramId } })
}

export async function findOrCreateUser(telegramId: string): Promise<User> {
  let user = await getUserByTelegramId(telegramId)
  if (!user) {
    user = await createUser(telegramId)
  }
  return user
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
  })
}
