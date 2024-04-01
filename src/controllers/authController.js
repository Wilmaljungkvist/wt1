/**
 * auth controller.
 *
 * @author Wilma Ljungkvist
 */
 import fetch from 'node-fetch'
 /**
  * Encapsulates a controller.
  */
 export class AuthController {

  #loggedIn
  #service
  #tokenData


  constructor(service) {
    this.#service = service
  }
   async login (req, res, next) {
    try {
      const scopes = ['read_user', 'read_api', 'read_repository', 'write_registry', 'read_registry', 'api']

      const scope = scopes.join(' ')

      const gitlabAuthUrl = `http://gitlab.lnu.se/oauth/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=${scope}`

      res.redirect(gitlabAuthUrl)
      res.status(200).send()
    } catch (error) {
      next(error)
    }
   }


   async handleAuthorization (req, res, next) {
    try {
      const returnedcode = req.query.code
      this.#tokenData = await this.#service.exchangeCodeForToken(returnedcode)
      req.session.accessToken = this.#tokenData.access_token
      this.#loggedIn = true
      res.redirect('/')
      res.status(200).send()
    } catch (error) {
      next(error)
    }
}

  async showProfile (req, res, next) {
    try {
      const data = await this.#service.showProfile(this.#tokenData.access_token)
    const loggedUser = this.#loggedIn
    res.render('layouts/profile', { loggedUser, data })
    res.status(200).send()
    } catch (error) {
      next(error)
    }
  }

  async showActivities (req, res, next) {
    try {
      const dataArr = await this.#service.showActivities(this.#tokenData.access_token)
    const loggedUser = this.#loggedIn
    if (dataArr.length > 101) {
      const latestActivities = dataArr.slice(0, 101)
      res.render('layouts/activities', { loggedUser, latestActivities })
    } else {
      const latestActivities = dataArr
      res.render('layouts/activities', { loggedUser, latestActivities })
    }
    res.status(200).send()
    } catch (error) {
      next(error)
    }
  }

  async groupProjects(req, res, next) {
    try {
      const data = await this.#service.showGroupProjects(this.#tokenData.access_token)
        data.currentUser.groups.nodes.forEach(async group => {
          if (group.avatarUrl !== null) {
            const response = await fetch(group.avatarUrl, {
              method: 'GET',
              headers: {
                'Authorization': 'Bearer ' + this.#tokenData.access_token
              }
            })
            const image = await response.text()
            console.log(image)
            console.log(group.avatarUrl)
          }
      })
      
        const loggedUser = this.#loggedIn
        res.render('layouts/projects', { loggedUser, data }) 
      res.status(200).send()
    } catch (error) {
      next(error)
    }
}
  
  async handleLogout (req, res, next) {
    try {
      const data = await this.#service.handleLogout(this.#tokenData.access_token)
    this.#loggedIn = false
    await req.session.destroy()
    res.redirect('/')
    res.status(200).send()
    } catch (error) {
      next(error)
    }
  }
 }