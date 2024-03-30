/**
 * Home routes.
 *
 * @author Wilma Ljungkvist
 */

 import express from 'express'
 
 export const router = express.Router()
 
 const resolveAuthController = (req) => req.app.get('container').resolve('TaskController')
 
 router.get('/', (req, res, next) => resolveAuthController(req).index(req, res, next))
 router.get('/redirect', (req, res, next) => resolveAuthController(req).login(req, res, next))
 router.get('/profile', (req, res, next) => resolveAuthController(req).showProfile(req, res, next))
 router.get('/activities', (req, res, next) => resolveAuthController(req).showActivities(req, res, next))
 router.get('/group-projects', (req, res, next) => resolveAuthController(req).groupProjects(req, res, next))
 router.get('/oauth/callback', (req, res, next) => resolveAuthController(req).handleAuthorization(req, res, next))
 router.get('/logout', (req, res, next) => resolveAuthController(req).handleLogout(req, res, next))

 