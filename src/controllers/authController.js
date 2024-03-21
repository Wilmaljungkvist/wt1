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
    const scope = 'read_user'
    const gitlabAuthUrl = `http://gitlab.lnu.se/oauth/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=${scope}`

    res.redirect(gitlabAuthUrl)
   }


   async handleAuthorization (req, res, next) {
    const Returnedcode = req.query.code

    const params = new URLSearchParams();
    params.append('client_id', process.env.CLIENT_ID);
    params.append('client_secret', process.env.CLIENT_SECRET);
    params.append('code', Returnedcode);
    params.append('redirect_uri', process.env.REDIRECT_URI);
    params.append('grant_type', 'authorization_code');

    console.log(params)

    const response = await fetch(process.env.GITLAB_TOKEN_URI, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded' // Change content type to application/x-www-form-urlencoded
        },
        body: params // Send parameters as URLSearchParams
    })

    if (!response.ok) {
        throw new Error('Failed to exchange authorization code for access token');
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const tokenData = await response.json();
        const accessToken = tokenData.access_token;
        console.log('AccessToken' + accessToken)
        res.redirect('/');
    } else {
        // Handle HTML response (error)
        const htmlContent = await response.text();
        console.error('Error response from OAuth provider:', htmlContent);
        // You can choose to redirect to an error page or send an error message
        res.status(500).send('Internal Server Error');
    }
}
 
 }