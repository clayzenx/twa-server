import express, { Request, Response } from 'express'
import { authenticateJWT } from '../middleware/auth'
import { loadUser } from '../middleware/userLoader'
import { getAvailableActivities, getActivityById } from '../services/activity'
import { incrementUserBalance } from '../services/user'
import { canPerformActivity, recordActivity } from '../services/userActivity'

const router = express.Router()

/**
 * GET /activities
 * Returns a list of activities with availability info for the authenticated user.
 */
router.get(
  '/',
  authenticateJWT,
  loadUser({ requireInitData: false }),
  async (req: Request, res: Response) => {
    const user = req.dbUser!
    const activities = await Promise.all(
      getAvailableActivities().map(async a => {
        const { available, nextAvailableAt } = await canPerformActivity(user.id, a)
        return {
          id: a.id,
          name: a.name,
          reward: a.reward,
          availability: a.availability,
          available,
          nextAvailableAt: nextAvailableAt?.toISOString(),
        }
      })
    )
    res.json(activities)
  }
)

/**
 * GET /activities/:id
 * Returns availability info for a single activity. Accepts query params for conditional availability.
 */
router.get(
  '/:id',
  authenticateJWT,
  loadUser({ requireInitData: false }),
  async (req: Request, res: Response) => {
    const { id } = req.params
    const activity = getActivityById(id)
    if (!activity) {
      res.status(404).json({ error: 'Activity not found' })
      return
    }
    const user = req.dbUser!
    const args = req.query as Record<string, any>
    try {
      const { available, nextAvailableAt, reason } = await canPerformActivity(user.id, activity, args)
      res.json({
        id: activity.id,
        name: activity.name,
        reward: activity.reward,
        availability: activity.availability,
        available,
        nextAvailableAt: nextAvailableAt?.toISOString(),
        reason,
      })
    } catch (err) {
      console.error('Error checking activity availability:', err)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * POST /activities/reward
 * Body: { id: string, args?: Record<string, any> }
 * Rewards the authenticated user if the activity is available.
 */
router.post(
  '/reward',
  authenticateJWT,
  loadUser({ requireInitData: false }),
  async (req: Request, res: Response) => {
    // Expect body: { id: string, args?: Record<string, any> }
    const { id, args } = req.body as { id?: string; args?: Record<string, any> }
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Missing activity id' })
      return
    }

    const activity = getActivityById(id)
    if (!activity) {
      res.status(404).json({ error: 'Activity not found' })
      return
    }

    const user = req.dbUser!
    try {
      const { available, nextAvailableAt, reason } = await canPerformActivity(user.id, activity, args)
      if (!available) {
        // Business logic: activity not available
        res.status(409).json({ error: reason || 'Activity not available', nextAvailableAt })
        return
      }
      await recordActivity(user.id, activity.id, args)
      const updatedUser = await incrementUserBalance(user.id, activity.reward)
      // Re-check availability for response
      const next = await canPerformActivity(user.id, activity)
      res.json({ user: updatedUser, activity, availability: next })
    } catch (err) {
      console.error('Error in rewarding user:', err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

export default router
