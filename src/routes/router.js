import express from 'express'
import { router as homeRouter } from './homeRouter.js'

export const router = express.Router()

router.use('/', homeRouter)

router.use('*', (req, res, next) => {
  const error = new Error('Not Found')
  error.status = 404
  next(error)
})
