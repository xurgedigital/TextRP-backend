// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Subscription from 'App/Models/Subscription'
import { bind } from '@adonisjs/route-model-binding'
import { schema } from '@ioc:Adonis/Core/Validator'

export default class SubscriptionsController {
  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const users = await Subscription.query().paginate(page, limit)
    users.baseUrl('/admin/subscriptions')
    return response.json(users)
  }

  public async create({ request, response }: HttpContextContract) {
    const updateUserSchema = schema.create({
      name: schema.string(),
      description: schema.string(),
      available_credits: schema.number(),
    })

    const payload = await request.validate({ schema: updateUserSchema })
    const user = await Subscription.create(payload)
    return response.json(user)
  }

  @bind()
  public async update({ request, response }: HttpContextContract, user: Subscription) {
    const updateUserSchema = schema.create({
      name: schema.string(),
      description: schema.string(),
      available_credits: schema.number(),
    })

    const payload = await request.validate({ schema: updateUserSchema })
    user.merge(payload)
    await user.save()
    return response.json(user)
  }

  @bind()
  public async delete({ response }: HttpContextContract, user: Subscription) {
    await user.delete()
    return response.status(200)
  }
}
