const routes = [
  'GET    /uploads/*',
  'GET    /',
  'POST        /webhook',
  'DELETE      /logout',
  'GET    /admin/users',
  'GET    /admin/users/1',
  'POST        /admin/users/1/credits/1',
  'POST        /admin/users/1/create_discount',
  'POST        /admin/users/1/discounts/1',
  'POST        /admin/users/1/create_subscription',
  'POST        /admin/users/1/user_subscriptions/1',
  'GET    /admin/credits',
  'POST        /admin/credits/1',
  'DELETE      /admin/credits/1',
  'GET    /admin/discounts',
  'POST        /admin/discounts',
  'POST        /admin/discounts/1',
  'DELETE      /admin/discounts/1',
  'GET    /admin/platform_settings',
  'POST        /admin/platform_settings',
  'POST        /admin/platform_settings/1',
  'DELETE      /admin/platform_settings/1',
  'GET    /admin/subscriptions',
  'POST        /admin/subscriptions',
  'POST        /admin/subscriptions/1',
  'DELETE      /admin/subscriptions/1',
  'GET    /admin/supported_nfts',
  'POST        /admin/supported_nfts',
  'POST        /admin/supported_nfts/1',
  'DELETE      /admin/supported_nfts/1',
  'POST        /user/update',
  'POST        /user/twilio/sendMessage',
]

const postmanCollection = {
  info: {
    name: 'API Routes',
  },
  item: [],
}

routes.forEach((route) => {
  const [method, path] = route.split(/\s+/)
  const paths = path.split('/').filter((el) => el !== '')
  const request = {
    method,
    url: {
      raw: `{{url}}${path}`,
      host: ['{{url}}'],
      path: [...paths],
    },
    header: [],
  }
  postmanCollection.item.push({ name: route, request })
})

console.log(JSON.stringify(postmanCollection, null, 2))
