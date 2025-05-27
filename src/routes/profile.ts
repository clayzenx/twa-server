import express from 'express'
import { authenticateJWT } from '../middleware/auth'
import { UserJwtPayload } from '../types/auth'

const router = express.Router()

router.get('/', authenticateJWT, (req, res) => {
  const user = req.user as UserJwtPayload
  console.log('/me user', user);
  res.json({ user })
})

export default router

