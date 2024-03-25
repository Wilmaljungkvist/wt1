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

  #service
  #tokenData


  constructor(service) {
    this.#service = service
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
      this.#tokenData = await this.#service.exchangeCodeForToken(returnedcode)
      const loggedUser = true
       res.render('home/index', { loggedUser })
    } catch (error) {
      console.error('Error occurred:', error)
      res.status(500).send('Internal Server Error')
    }
}

  async showProfile (req, res, next) {
    const response = await fetch('https://gitlab.lnu.se/api/v4/user', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + this.#tokenData.access_token
      }
    })
    const data = await response.json()
    const loggedUser = true
    res.render('layouts/profile', { loggedUser, data })
  }

  async showActivities(req, res, next) {
    const dataArr = []
    let page = 1
    let totalCount = 0
  
    while (dataArr.length < 101) {
      console.log(totalCount)
      const response = await fetch(`https://gitlab.lnu.se/api/v4/events?page=${page}&per_page=100`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + this.#tokenData.access_token
        }
      })
  
      const data = await response.json()
  
      if (data.length === 0) {
        break
      }
  
      dataArr.push(...data)
      totalCount += data.length
      page++
    }
  
    const loggedUser = true
    if (dataArr.length > 101) {
      const latestActivities = dataArr.slice(0, 101)
      res.render('layouts/activities', { loggedUser, latestActivities })
    } else {
      const latestActivities = dataArr
      res.render('layouts/activities', { loggedUser, latestActivities })
    }
  }
 }