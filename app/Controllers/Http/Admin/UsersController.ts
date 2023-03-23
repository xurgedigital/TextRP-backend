import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import { bind } from '@adonisjs/route-model-binding'
import { schema } from '@ioc:Adonis/Core/Validator'
import UserCredit from 'App/Models/UserCredit'
import Discount from 'App/Models/Discount'
import UserSubscription from 'App/Models/UserSubscription'
import { loadUserData } from 'App/Controllers/Http/User/UsersController'

export default class UsersController {
  public async index({ request, response }: HttpContextContract) {
    const { search } = request.qs()
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const query = User.query()
    if (search && typeof search === 'string') {
      query
        .where((query) => {
          query.where('name', 'LIKE', '%' + search + '%')
        })
        .orWhere((query) => {
          query.where('address', 'LIKE', '%' + search + '%')
        })
    }
    const users = await query
      .preload('discount')
      .preload('subscriptions')
      .preload('credit')
      .paginate(page, limit)
    users.baseUrl('/admin/users')
    return response.json(users)
  }

  @bind()
  public async update({ request, response }: HttpContextContract, user: User) {
    const updateUserSchema = schema.create({
      name: schema.string.optional(),
      isActive: schema.boolean.optional(),
      textRpUsername: schema.string.optional(),
      about: schema.string.optional(),
      profile_picture: schema.string.optional(),
    })

    const payload = await request.validate({ schema: updateUserSchema })
    user.merge(payload)
    await user.save()
    await loadUserData(user)
    return response.json(user)
  }

  @bind()
  public async show({ response }: HttpContextContract, user: User) {
    await loadUserData(user)
    return response.json(user)
  }

  @bind()
  public async updateCredit(
    { request, response }: HttpContextContract,
    user: User,
    credit: UserCredit
  ) {
    const updateUserSchema = schema.create({
      balance: schema.number(),
    })

    const payload = await request.validate({ schema: updateUserSchema })
    credit.merge(payload)
    await credit.save()
    await loadUserData(user)
    return response.json(user)
  }

  @bind()
  public async createCredit({ request, response }: HttpContextContract, user: User) {
    const updateUserSchema = schema.create({
      balance: schema.number(),
    })

    const payload = await request.validate({ schema: updateUserSchema })
    await UserCredit.firstOrCreate(
      {
        userId: user.id,
      },
      payload
    )
    await loadUserData(user)
    return response.json(user)
  }

  @bind()
  public async updateDiscount(
    { request, response }: HttpContextContract,
    user: User,
    discount: Discount
  ) {
    const updateUserSchema = schema.create({
      discount: schema.number(),
    })

    const payload = await request.validate({ schema: updateUserSchema })
    discount.merge({
      ...payload,
    })
    await discount.save()
    await loadUserData(user)
    return response.json(user)
  }

  @bind()
  public async createDiscount({ request, response }: HttpContextContract, user: User) {
    const updateUserSchema = schema.create({
      discount: schema.number(),
    })

    const payload = await request.validate({ schema: updateUserSchema })
    await Discount.firstOrCreate(
      {
        address: user.address,
      },
      payload
    )
    await loadUserData(user)
    return response.json(user)
  }

  @bind()
  public async updateSubscription(
    { request, response }: HttpContextContract,
    user: User,
    userSubscription: UserSubscription
  ) {
    const updateUserSchema = schema.create({
      expires_at: schema.date(),
    })

    const payload = await request.validate({ schema: updateUserSchema })
    userSubscription.merge(payload)
    await userSubscription.save()
    await loadUserData(user)
    return response.json(user)
  }

  @bind()
  public async createSubscription({ request, response }: HttpContextContract, user: User) {
    const updateUserSchema = schema.create({
      subscriptionId: schema.number(),
      expires_at: schema.date(),
    })

    const payload = await request.validate({ schema: updateUserSchema })
    await UserSubscription.firstOrCreate(
      {
        userId: user.id,
      },
      payload
    )
    await loadUserData(user)
    return response.json(user)
  }
}
