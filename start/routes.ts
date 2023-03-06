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

Route.get('/', async () => {
  return { hello: 'You have found me now do you know what to do?' }
})

Route.get('/login', 'AuthController.login')

Route.post('/webhook', 'AuthController.webhook')

Route.get('/me', async ({ auth }) => {
  const user = await auth.use('web').user
  return { me: user }
}).middleware('auth')

Route.delete('/logout', async ({ session, auth }) => {
  session.forget('current_uuid')
  await auth.use('web').logout()
  return { success: true }
}).middleware('auth')

Route.group(() => {
  Route.group(() => {
    Route.get('/', 'Admin/UsersController.index')
    Route.post('/:user', 'Admin/UsersController.update')
    Route.post('/:user/create_credit', 'Admin/UsersController.createCredit')
    Route.post('/:user/credits/:credit', 'Admin/UsersController.updateCredit')
    Route.post('/:user/create_discount', 'Admin/UsersController.updateDiscount')
    Route.post('/:user/discounts/:discount', 'Admin/UsersController.createDiscount')
    Route.post('/:user/create_subscription', 'Admin/UsersController.updateSubscription')
    Route.post(
      '/:user/user_subscriptions/:user_subscription',
      'Admin/UsersController.createSubscription'
    )
  }).prefix('/users')

  Route.group(() => {
    Route.get('/', 'Admin/CreditsController.index')
    Route.post('/', 'Admin/CreditsController.create')
    Route.post('/:credit', 'Admin/CreditsController.update')
    Route.delete('/:credit', 'Admin/CreditsController.delete')
  }).prefix('/credits')

  Route.group(() => {
    Route.get('/', 'Admin/DiscountsController.index')
    Route.post('/', 'Admin/DiscountsController.create')
    Route.post('/:discount', 'Admin/DiscountsController.update')
    Route.delete('/:discount', 'Admin/DiscountsController.delete')
  }).prefix('/discounts')

  Route.group(() => {
    Route.get('/', 'Admin/PlatformSettingsController.index')
    Route.post('/', 'Admin/PlatformSettingsController.create')
    Route.post('/:platform_setting', 'Admin/PlatformSettingsController.update')
    Route.delete('/:platform_setting', 'Admin/PlatformSettingsController.delete')
  }).prefix('/platform_settings')

  Route.group(() => {
    Route.get('/', 'Admin/SubscriptionsController.index')
    Route.post('/', 'Admin/SubscriptionsController.create')
    Route.post('/:subscription', 'Admin/SubscriptionsController.update')
    Route.delete('/:subscription', 'Admin/SubscriptionsController.delete')
  }).prefix('/subscriptions')

  Route.group(() => {
    Route.get('/', 'Admin/SupportedNftsController.index')
    Route.post('/', 'Admin/SupportedNftsController.create')
    Route.post('/:supported_nft', 'Admin/SupportedNftsController.update')
    Route.delete('/:supported_nft', 'Admin/SupportedNftsController.delete')
  }).prefix('/supported_nfts')
})
  .middleware('auth')
  .prefix('/admin')
