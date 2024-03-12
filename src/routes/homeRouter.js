/**
 * Home routes.
 *
 * @author Wilma Ljungkvist
 */

import express from 'express'
import { HomeController } from '../controllers/homeController.js'

export const router = express.Router()

const controller = new HomeController()

router.get('/', (req, res, next) => controller.index(req, res, next))
