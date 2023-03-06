import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import { bind } from '@adonisjs/route-model-binding'
import { schema } from '@ioc:Adonis/Core/Validator'
import UserCredit from 'App/Models/UserCredit'
import Discount from 'App/Models/Discount'
import UserSubscription from 'App/Models/UserSubscription'

export default class UsersController {
  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const users = await User.query()
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
      name: schema.string(),
    })

    const payload = await request.validate({ schema: updateUserSchema })
    user.merge(payload)
    await user.save()
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
        user_id: user.id,
      },
      payload
    )
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
    return response.json(user)
  }
}
