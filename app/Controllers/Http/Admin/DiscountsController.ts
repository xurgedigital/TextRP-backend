// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Discount from 'App/Models/Discount'
import { bind } from '@adonisjs/route-model-binding'
import { schema } from '@ioc:Adonis/Core/Validator'

export default class DiscountsController {
  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const users = await Discount.query().paginate(page, limit)
    users.baseUrl('/admin/discounts')
    return response.json(users)
  }

  public async create({ request, response }: HttpContextContract) {
    const updateUserSchema = schema.create({
      address: schema.string(),
      discount: schema.number(),
    })

    const payload = await request.validate({ schema: updateUserSchema })
    const user = await Discount.create(payload)
    return response.json(user)
  }

  @bind()
  public async update({ request, response }: HttpContextContract, user: Discount) {
    const updateUserSchema = schema.create({
      address: schema.string(),
      discount: schema.number(),
    })

    const payload = await request.validate({ schema: updateUserSchema })
    user.merge(payload)
    await user.save()
    return response.json(user)
  }

  @bind()
  public async delete({ response }: HttpContextContract, user: Discount) {
    await user.delete()
    return response.status(200)
  }
}
