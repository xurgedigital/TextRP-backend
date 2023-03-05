/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'
import User from 'App/Models/User'

Route.get('/', async () => {
  return { hello: 'You have found me now do you know what to do?' }
})

Route.get('/login', 'AuthController.login')

Route.post('/webhook', 'AuthController.webhook')

Route.get('/me', async ({ auth }) => {
  await auth.use('web').authenticate()
  const user = await auth.use('web').user
  return { me: user }
})

Route.post('/logout', async ({ session }) => {
  session.forget('current_uuid')
  return { success: true }
})

Route.get('/xumm/redirect', async ({ ally }) => {
  return ally.use('xumm').redirect((request) => {
    request
      .scopes(['XummPkce'])
      // .param('grant_type', 'authorization_code')
      .param('response_type', 'token')
  })
})

Route.get('/xumm/callback', async ({ ally, auth, response }) => {
  const github = ally.use('xumm')

  /**
   * User has explicitly denied the login request
   */
  if (github.accessDenied()) {
    return 'Access was denied'
  }

  /**
   * Unable to verify the CSRF state
   */
  if (github.stateMisMatch()) {
    return 'Request expired. Retry again'
  }

  /**
   * There was an unknown error during the redirect
   */
  if (github.hasError()) {
    return github.getError()
  }

  /**
   * Finally, access the user
   */
  const user = await github.user()

  const finalUser = await User.firstOrCreate(
    {
      address: user.id,
    },
    {
      name: user.name,
      email: user.email,
      access_token: user.token.token,
      profile_picture: user.avatarUrl,
    }
  )

  /**
   * Login user using the web guard
   */
  await auth.use('web').login(finalUser)

  return response.redirect('/')
})
