/**
 * Home controller.
 *
 * @author Wilma Ljungkvist
 */
 import fetch from 'node-fetch'
 import { AuthService } from '../services/authService.js'
 /**
  * Encapsulates a controller.
  */
 export class AuthController {

  constructor() {
    this.authService = new AuthService()
  }

   /**
    * Renders a view and sends the rendered HTML string as an HTTP response.
    * index GET.
    *
    * @param {object} req - Express request object.
    * @param {object} res - Express response object.
    * @param {Function} next - Express next middleware function.
    */
   async index (req, res, next) {
     try {
       const loggedUser = true
       res.render('home/index', { loggedUser })
     } catch (error) {
       console.error('Error occurred:', error)
       res.status(404).send('Not found')
     }
   }

   async login (req, res, next) {
    const scope = 'read_user'
    const gitlabAuthUrl = `http://gitlab.lnu.se/oauth/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=${scope}`

    res.redirect(gitlabAuthUrl)
   }


   async handleAuthorization (req, res, next) {
    try {
      const returnedcode = req.query.code
      const tokenData = await this.authService.exchangeCodeForToken(returnedcode)
      console.log(tokenData)
      res.redirect('/auth')
    } catch (error) {
      console.error('Error occurred:', error)
      res.status(500).send('Internal Server Error')
    }
}
 
 }