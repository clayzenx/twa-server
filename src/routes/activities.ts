import express, { Request, Response } from 'express'
import { authenticateJWT } from '../middleware/auth'
import type { UserJwtPayload } from '../types/auth'
import {
  getAvailableActivities,
  encodeActivityToken,
  decodeActivityToken,
  getActivityById,
} from '../services/activity'
import { findOrCreateUser, incrementUserBalance } from '../services/user'

const router = express.Router()

/**
 * GET /activities
 * Returns a list of available activities with encrypted tokens.
 */
router.get('/', authenticateJWT, (req: Request, res: Response) => {
  const activities = getAvailableActivities().map(a => ({
    id: a.id,
    token: encodeActivityToken(a.id),
    name: a.name,
    reward: a.reward,
  }))
  res.json(activities)
})

/**
 * POST /activities/reward
 * Body: { token: string }
 * Rewards the authenticated user with the specified activity.
 */
router.post('/reward', authenticateJWT, async (req: Request, res: Response) => {
  const { activityId } = req.body
  if (!activityId || typeof activityId !== 'string') {
    res.status(400).json({ error: 'Missing activity id' })
    return
  }

  const activity = getActivityById(activityId)
  if (!activity) {
    res.status(404).json({ error: 'Activity not found' })
    return
  }

  const userPayload = req.user as UserJwtPayload
  try {
    const user = await findOrCreateUser(userPayload.id.toString())
    const updatedUser = await incrementUserBalance(user.id, activity.reward)
    res.json({ user: updatedUser, activity })
  } catch (err) {
    console.error('Error in rewarding user:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
