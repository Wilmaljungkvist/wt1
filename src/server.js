import httpContext from 'express-http-context'
import { randomUUID } from 'node:crypto'
import '@lnu/json-js-cycle'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors' 

import { container } from './config/bootstrap.js'
import expressLayouts from 'express-ejs-layouts'
import session from 'express-session'
import logger from 'morgan'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { router } from './routes/router.js'
try {
  const directoryFullName = dirname(fileURLToPath(import.meta.url))

  const app = express()

  const baseURL = process.env.BASE_URL || '/'

  app.use(logger('dev'))
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'"],
        'img-src': ["'self'", '*.gravatar.com', 'gitlab.lnu.se', 'data:', 'http://localhost:8080'],
      },
    },
  }))

  const allowedOrgins = ['http://localhost:8080', 'https://gitlab.lnu.se', 'https://gitlab.lnu.se/uploads/-/system/group/avatar/38430/0.png']
  app.use('*', cors({
    origin: allowedOrgins,
    credentials: true,
    preflightContinue: true, 
    optionsSuccessStatus: 204
  }))
  
  app.use(httpContext.middleware)

  app.set('view engine', 'ejs')
  app.set('views', join(directoryFullName, 'views'))
  app.set('container', container)
  app.use(expressLayouts) 
  app.set('layout', join(directoryFullName, 'views', 'layouts', 'default'))

  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))

  app.use('/', express.static(join(directoryFullName, '..', 'public')))

  const sessionOptions = {
    name: process.env.SESSION_NAME,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 12,
      sameSite: 'lax'
    }
  }

  if (app.get('env') === 'production') {
    app.set('trust proxy', 1)
    sessionOptions.cookie.secure = true
  }

  app.use(session(sessionOptions))

  app.use('/', router)

  // TODO: GLÖM INTE BRA FELHANTERING. 
  app.use((err, req, res, next) => {
    if (err.status === 404) {
      return res
        .status(404)
        .sendFile(join(directoryFullName, 'views', 'errors', '404.html'))
    }

    if (req.app.get('env') !== 'development') {
      return res
        .status(500)
        .sendFile(join(directoryFullName, 'views', 'errors', '500.html'))
    }

    res
      .status(err.status || 500)
      .render('errors/error', { error: err })
  })

  const server = app.listen(process.env.PORT, () => {
    console.log(`Server running at http://localhost:${process.env.PORT}/`)
    console.log('Press Ctrl-C to terminate...')
  })
} catch (err) {
  console.error(err)
  process.exitCode = 1
}
