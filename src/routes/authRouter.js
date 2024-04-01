/**
 * Home routes.
 *
 * @author Wilma Ljungkvist
 */

 import express from 'express'
 
 export const router = express.Router()

 const sessionExistsMiddleware = (req, res, next) => {
    if (!req.session.accessToken) {
      return res.redirect('/')
    }
    next()
  }
 
 const resolveAuthController = (req) => req.app.get('container').resolve('TaskController')
 
 router.get('/redirect', (req, res, next) => resolveAuthController(req).login(req, res, next))
 router.get('/profile', sessionExistsMiddleware, (req, res, next) => resolveAuthController(req).showProfile(req, res, next))
 router.get('/activities', sessionExistsMiddleware, (req, res, next) => resolveAuthController(req).showActivities(req, res, next))
 router.get('/group-projects', sessionExistsMiddleware, (req, res, next) => resolveAuthController(req).groupProjects(req, res, next))
 router.get('/oauth/callback', (req, res, next) => resolveAuthController(req).handleAuthorization(req, res, next))
 router.get('/logout', sessionExistsMiddleware, (req, res, next) => resolveAuthController(req).handleLogout(req, res, next))

 