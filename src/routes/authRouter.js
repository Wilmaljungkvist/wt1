/**
 * Home routes.
 *
 * @author Wilma Ljungkvist
 */

 import express from 'express'
 import { AuthController } from '../controllers/authController.js'
 
 export const router = express.Router()
 
 const controller = new AuthController()
 
 router.get('/', (req, res, next) => controller.index(req, res, next))
 