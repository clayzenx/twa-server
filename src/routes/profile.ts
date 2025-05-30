import express, { Request, Response } from 'express'
import { authenticateJWT } from '../middleware/auth'
import { UserJwtPayload } from '../types/auth'
import { findOrCreateUser } from '../services/user'

const router = express.Router()

router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  const userPayload = req.user as UserJwtPayload
  try {
    const user = await findOrCreateUser(userPayload.id.toString())
    res.json({ user })
  } catch (err) {
    console.error('Error fetching user from DB:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

