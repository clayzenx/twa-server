import express from 'express'
import { authenticateJWT } from '../middleware/auth'
import { UserJwtPayload } from '../types/auth'

const router = express.Router()

router.get('/', authenticateJWT, (req, res) => {
  const user = req.user as UserJwtPayload
  res.json({ user })
})

export default router

