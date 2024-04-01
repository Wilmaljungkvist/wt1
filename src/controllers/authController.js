/**
 * Home controller.
 *
 * @author Wilma Ljungkvist
 */
 import fetch from 'node-fetch'
 import { GraphQLClient, gql } from 'graphql-request' 
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

    const scopes = ['read_user', 'read_api', 'read_repository', 'write_registry', 'read_registry', 'api']
    // TODO: ADD TRY CATCH 
    const scope = scopes.join(' ')
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
    const data = await this.#service.showProfile(this.#tokenData.access_token)
    const loggedUser = true
    res.render('layouts/profile', { loggedUser, data })
  }

  async showActivities (req, res, next) {
    const dataArr = await this.#service.showActivities(this.#tokenData.access_token)
    const loggedUser = true 
    if (dataArr.length > 101) {
      const latestActivities = dataArr.slice(0, 101)
      res.render('layouts/activities', { loggedUser, latestActivities })
    } else {
      const latestActivities = dataArr
      res.render('layouts/activities', { loggedUser, latestActivities })
    }
  }

  async groupProjects(req, res, next) {
    const graphQLClient = new GraphQLClient('https://gitlab.lnu.se/api/graphql', {
        headers: {
            authorization: 'Bearer ' + this.#tokenData.access_token
        }
    })

    const query = gql`
        query {
            currentUser {
                groups {
                    pageInfo {
                        endCursor
                        hasNextPage
                    }
                    nodes {
                        id
                        name
                        fullPath
                        avatarUrl
                        path
                        projects {
                            nodes {
                                id
                                name
                                fullPath
                                avatarUrl
                                path
                                repository {
                                    tree {
                                        lastCommit {
                                            authoredDate
                                            author {
                                                name
                                                username
                                                avatarUrl
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    `

        const data = await graphQLClient.request(query)
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
      
        const loggedUser = true
        res.render('layouts/projects', { loggedUser, data })  
}
  
  async handleLogout (req, res, next) {
    const data = await this.#service.handleLogout(this.#tokenData.access_token)
    const loggedUser = true
    res.render('home/index', { loggedUser })
  }
 }