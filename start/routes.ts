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
import FeaturesController from 'App/Controllers/Http/FeaturesController'
import NFTController from 'App/Controllers/Http/NFTController'
import PlatformSetting from 'App/Models/PlatformSetting'

Route.get('/', async () => {
  return { hello: 'You me now do you know what to do?' }
})

Route.get('/get-all-env', async ({ response }) => {
  const data = await PlatformSetting.query().where('key', 'xrplActive')
  return response.json(data)
})

Route.get('/available-features', async () => {
  // added login
  return { features: ['twilio', 'discord', 'twitter', 'dark_mode', 'login'] }
})

// get all nfts
Route.get('/my-features/:address/:network/all', async ({ response, request }) => {
  const allNftsData = await NFTController.AllNfts(
    request.param('address'),
    request.param('network', 'main')
  )
  console.log('from route', allNftsData)

  return response.json(allNftsData || { error: true })
})
Route.get('/get-all-feature', async ({ response }) => {
  const res = await NFTController.getAllFeature()
  return response.json(res || { error: true })
})
Route.post('/create-new-feature', async ({ response, request }) => {
  const { feature, rule, description } = request.body()
  const res = await NFTController.addFeature(feature, rule, description)
  return response.json(res || { error: true })
})

Route.put('/update-feature/:id', async ({ response, request }) => {
  const { feature, rule, description } = request.body()
  const { id } = request.params()

  // return response.json({id})
  const res = await NFTController.updateFeature(id, feature, rule, description)
  // console.log("TTTTTTTTTTT", res);

  return response.json(res || { error: true })
})

Route.delete('/delete-nfts/:id', async ({ response, request }) => {
  const { id } = request.params()
  // return response.json({id})
  const res = await NFTController.deleteNFT(id)
  // console.log("TTTTTTTTTTT", res);

  return response.json(res || { error: true })
})

Route.get('/get-all-nfts', async ({ response }) => {
  const res = await NFTController.getAllNFTS()
  return response.json(res || { error: true })
})
Route.post('/create-new-nft', async ({ response, request }) => {
  const { title, url, description, contractAddress, taxon, imageLink } = request.body()
  const res = await NFTController.addNFT(contractAddress, title, description, taxon, url, imageLink)
  return response.json(res || { error: true })
})

Route.put('/update-nft/:id', async ({ response, request }) => {
  const { title, url, description, contractAddress, taxon, imageLink } = request.body()
  const { id } = request.params()
  const res = await NFTController.updateNFT(
    id,
    contractAddress,
    title,
    description,
    taxon,
    url,
    imageLink
  )
  // console.log("TTTTTTTTTTT", res);

  return response.json(res || { error: true })
})

Route.delete('/delete-nft/:id', async ({ response, request }) => {
  const { id } = request.params()
  const res = await NFTController.deleteNFT(id)
  return response.json(res || { error: true })
})

Route.delete('/delete-feature/:id', async ({ response, request }) => {
  const { id } = request.params()
  const res = await NFTController.deleteFeature(id)
  return response.json(res || { error: true })
})
Route.post('/set-nft-for-feature/:id', async ({ response, request }) => {
  const { id } = request.params()
  const nfts =
    typeof request.body().nfts === 'string' ? JSON.parse(request.body().nfts) : request.body().nfts
  const res = await NFTController.setAllNftOfFeature(Number(id), nfts)
  return response.json(res || { error: true })
})
Route.get('/get-nft-for-feature/:id', async ({ response, request }) => {
  const { id } = request.params()
  const res = await NFTController.getAllNftOfFeature(Number(id))
  return response.json(res || { error: true })
})
// Route.delete('/get-all-nfts', async ({ response }) => {
//   const res = await NFTController.deleteNFT(id)
//   // console.log("TTTTTTTTTTT", res);
//   return response.json(res || { error: true })
// })
// get Available Nfts

Route.get('/my-features/:address/:network', async ({ response, request }) => {
  const verified = await NFTController.verify(
    request.param('address'),
    request.param('network', 'main')
  )
  return response.json(verified || { error: true })
})
Route.get('/verify-address/:address', async ({ response, request }) => {
  const result = await NFTController.verifyAddress(request.param('address'))
  return response.json(result || { error: true })
})
// get Enabled Nfts
Route.get('/my-features/:address/:network/enabled', async ({ response, request }) => {
  const verified = await NFTController.enabledNfts(
    request.param('address'),
    request.param('network', 'main')
  )
  return response.json(verified || { error: true })
})

Route.group(() => {
  Route.get('/', 'Admin/SupportedNftsController.index')
}).prefix('/supported_nftss')

Route.get('/login-user', 'AuthController.loginUser')
Route.post('/login-user', 'AuthController.loginUser')
// Route.get('/login', 'AuthController.login')
Route.post('/chat-webhook', 'WebHook/WebhookController.update')

Route.post('/webhook', 'AuthController.webhook')
Route.get('/check-nft/:address/:network/:service', 'NFTController.check')

Route.get('/me', 'User/UsersController.index').middleware(['auth', 'active'])
Route.post('/my-address', 'User/UsersController.fromAddress')

Route.delete('/logout', async ({ session, auth }) => {
  session.forget('current_uuid')
  await auth.use('web').logout()
  return { success: true }
}).middleware(['auth', 'active'])

Route.post('payment/credit/:credit', 'User/PaymentController.createPayment')
Route.post('accounts/:address/payments', 'User/PaymentController.transferWithSecretKey')
Route.post('payment/subscription/:credit', 'User/PaymentController.createSubscription')

Route.group(() => {
  Route.group(() => {
    Route.get('/', 'Admin/UsersController.index')
    Route.get('/:user', 'Admin/UsersController.show')
    Route.post('/:user', 'Admin/UsersController.update')
    Route.post('/:user/create_credit', 'Admin/UsersController.createCredit')
    Route.post('/:user/credits/:credit', 'Admin/UsersController.updateCredit')
    Route.post('/:user/create_discount', 'Admin/UsersController.createDiscount')
    Route.post('/:user/discounts/:discount', 'Admin/UsersController.updateDiscount')
    Route.post('/:user/create_subscription', 'Admin/UsersController.createSubscription')
    Route.post(
      '/:user/user_subscriptions/:user_subscription',
      'Admin/UsersController.updateSubscription'
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
    Route.post('/bulk', 'Admin/PlatformSettingsController.bulkCreateOrUpdate')
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
  .middleware(['auth', 'active'])
  .prefix('/admin')
Route.post('/URLtoNFTData', 'Admin/SupportedNftsController.getDataFromURL')

Route.group(() => {
  Route.get('/me', 'User/UsersController.index')
  Route.post('/update', 'User/UsersController.update')
  Route.post('/payment/:credit', 'User/PaymentController.payment')
  Route.post('creditPayment/:credit', 'User/PaymentController.creditPayment')
  Route.post('subscriptionPayment/:subscription', 'User/PaymentController.subscriptionPayment')

  Route.group(() => {
    Route.get('/token', 'User/TwilioController.generateToken')
    Route.post('/send_message/:conversation', 'User/TwilioController.sendMessage')
    Route.post('/create_conversation', 'User/TwilioController.createConversation')
    Route.post('/start_conversation/:conversation', 'User/TwilioController.startConversation')
    Route.get(
      '/get_all_messages/:conversation',
      'User/TwilioController.getAllMessagesFromConversation'
    )
    Route.get('/mark_message_as_read/:message', 'User/TwilioController.markMessageAsRead')
  }).prefix('/twilio')
})
  .middleware(['auth', 'active'])
  .prefix('/user')

Route.group(() => {
  Route.get('/credits', 'Admin/CreditsController.index')
  Route.get('/supported_nfts', 'Admin/SupportedNftsController.index')
  Route.get('/subscriptions', 'Admin/SubscriptionsController.index')
})
// .middleware(['auth', 'active'])

Route.get('/get_feature_list', async ({ response }) => {
  const featureList = await FeaturesController.getAllFeatures()
  return response.json(featureList)
})
