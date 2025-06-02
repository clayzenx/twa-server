import express, { Request, Response } from 'express'
import { authenticateJWT } from '../middleware/jwtAuthentication'
import { loadUser } from '../middleware/userLoader'
import { getAvailableActivities, getActivityById, canPerformActivity, rewardActivity, ActivityUnavailableError, ActivityNotFoundError } from '../services/activity'

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
    const { id, args } = req.body as { id?: string; args?: Record<string, any> }
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Missing activity id' })
      return
    }
    const user = req.dbUser!
    try {
      const result = await rewardActivity(user.id, id, args)
      res.json({ user: result.user, activity: result.activity, availability: result.availability })
    } catch (err: unknown) {
      if (err instanceof ActivityUnavailableError) {
        console.log('err', err.message);
        res.status(409).json({ error: err.message, nextAvailableAt: err.nextAvailableAt })
        return
      }
      if (err instanceof ActivityNotFoundError) {
        res.status(404).json({ error: err.message })
        return
      }
      console.error('Error in rewarding user:', err)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
