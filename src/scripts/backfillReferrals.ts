import { prisma } from '../db'

async function main() {
  console.log('Starting referral backfill...')
  // Fetch all referral activity records
  const referralRecords = await prisma.userActivity.findMany({
    where: { activityId: 'referral' },
    select: { userId: true, meta: true },
  })
  console.log(`Found ${referralRecords.length} referral records.`)
  let updatedCount = 0
  for (const rec of referralRecords) {
    // meta should contain referrerTelegramId (may be string or number)
    const meta = rec.meta as { referrerTelegramId?: string | number }
    const raw = meta.referrerTelegramId
    if (raw == null) {
      console.warn(`Skipping userId=${rec.userId}: missing referrerTelegramId in meta`)
      continue
    }
    const code = String(raw)
    // Find referrer user by Telegram ID
    const refUser = await prisma.user.findUnique({ where: { telegramId: code } })
    if (!refUser) {
      console.warn(`No user found with telegramId=${code} for userId=${rec.userId}`)
      continue
    }
    // Update referredById if not already set
    const existing = await prisma.user.findUnique({
      where: { id: rec.userId },
      select: { referredById: true },
    })
    if (existing?.referredById) {
      // already set, skip
      continue
    }
    await prisma.user.update({
      where: { id: rec.userId },
      data: { referredById: refUser.id },
    })
    updatedCount++
    console.log(`Linked userId=${rec.userId} referredById=${refUser.id}`)
  }
  console.log(`Referral backfill completed: ${updatedCount} users updated.`)
}

main()
  .catch(err => {
    console.error('Error in backfillReferrals:', err)
  })
  .finally(() => prisma.$disconnect())