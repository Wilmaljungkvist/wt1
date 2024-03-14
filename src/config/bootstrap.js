import { HomeController } from '../controllers/homeController.js'
import { AuthController } from '../controllers/authController.js'
import { IoCContainer } from '../lib/IoCContainer.js'
import { AuthService } from '../services/authService.js'

const iocContainer = new IoCContainer()

iocContainer.registerSingleton('AuthService', AuthService)
iocContainer.registerSingleton('TaskController', AuthController, ['AuthService'])
iocContainer.registerSingleton('HomeController', HomeController)

export const container = Object.freeze(iocContainer)
