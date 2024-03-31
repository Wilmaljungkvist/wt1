import fetch from 'node-fetch'
export class AuthService {

  async exchangeCodeForToken(code) {
    // TODO: ADD SECRET STRING FOR LOGIN/KEY!
    const params = new URLSearchParams()
    params.append('client_id', process.env.CLIENT_ID)
    params.append('client_secret', process.env.CLIENT_SECRET)
    params.append('code', code)
    params.append('redirect_uri', process.env.REDIRECT_URI)
    params.append('grant_type', 'authorization_code')

    const response = await fetch(process.env.GITLAB_TOKEN_URI, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    })

    if (!response.ok) {
      throw new Error('Failed to exchange authorization code for access token')
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      return data
    } else {
      const htmlContent = await response.text()
      console.error('Error response from OAuth provider:', htmlContent)
      throw new Error('Internal Server Error')
    }
    }


    async showProfile (accessToken) {
      const response = await fetch('https://gitlab.lnu.se/api/v4/user', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + accessToken
      }
    })
    const data = await response.json()
    return data
    }
}