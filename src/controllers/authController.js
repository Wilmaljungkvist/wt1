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

    console.log(gitlabAuthUrl)
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

  async groupProjects(req, res, next) {
    const graphQLClient = new GraphQLClient('https://gitlab.lnu.se/api/graphql', {
        headers: {
            authorization: 'Bearer ' + this.#tokenData.access_token
        }
    });

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
    `;

    try {
        const data = await graphQLClient.request(query);
        
        // Fetch and update group avatars
        for (const group of data.currentUser.groups.nodes) {
            if (group.avatarUrl !== null) {
                const groupId = group.avatarUrl.match(/\/avatar\/(\d+)\//)[1];
                const newGroupAvatarUrl = `https://gitlab.lnu.se/api/v4/groups/${groupId}/avatar`;
                const response = await fetch(newGroupAvatarUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + this.#tokenData.access_token
                    }
                });
                const imageBuffer = await response.buffer();
                const base64Image = imageBuffer.toString('base64');
                group.avatarUrl = base64Image;
            }
        }

        // Fetch and update project avatars
        for (const group of data.currentUser.groups.nodes) {
            for (const project of group.projects.nodes) {
                if (project.avatarUrl !== null) {
                    const projectId = project.avatarUrl.match(/\/avatar\/(\d+)\//)[1];
                    const newProjectAvatarUrl = `https://gitlab.lnu.se/api/v4/projects/${projectId}/avatar`;
                    const response = await fetch(newProjectAvatarUrl, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: 'Bearer ' + this.#tokenData.access_token
                        }
                    });
                    const imageBuffer = await response.buffer();
                    const base64Image = imageBuffer.toString('base64');
                    project.avatarUrl = base64Image;
                }
            }
        }

        const loggedUser = true;
        res.render('layouts/projects', { loggedUser, data });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}
  
  async handleLogout (req, res, next) {
    const body = {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      token: this.#tokenData.access_token
    }

    const response = await fetch('https://gitlab.lnu.se/oauth/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    // CHECK IF LOGOUT IS CORRECT

    const loggedUser = true
    res.render('home/index', { loggedUser })
  }
 }