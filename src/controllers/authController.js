/**
 * Home controller.
 *
 * @author Wilma Ljungkvist
 */
 import fetch from 'node-fetch'
 /**
  * Encapsulates a controller.
  */
 export class AuthController {
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
    const params = 
    res.redirect('https://gitlab.lnu.se/oauth/token')
   }
 
 }