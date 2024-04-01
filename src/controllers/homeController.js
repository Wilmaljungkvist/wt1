/**
 * Home controller.
 *
 * @author Wilma Ljungkvist
 */
import fetch from 'node-fetch'
/**
 * Encapsulates a controller.
 */
export class HomeController {
  /**
   * Renders a view and sends the rendered HTML string as an HTTP response.
   * index GET.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
   async index(req, res, next) {
    try {
      let loggedUser = false
      if (req.session.accessToken) {
        loggedUser = true
      }
      res.render('home/index', { loggedUser })
    } catch (error) {
      console.error('Error occurred:', error)
      res.status(404).send('Not found')
    }
  }

}