import { prisma } from '../db'
import type { User } from '@prisma/client'

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