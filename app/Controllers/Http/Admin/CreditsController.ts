import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { bind } from '@adonisjs/route-model-binding'
import { schema } from '@ioc:Adonis/Core/Validator'
import Credit from 'App/Models/Credit'

export default class CreditsController {
  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const users = await Credit.query().orderBy('name', 'asc').paginate(page, limit)
    users.baseUrl('/admin/credits')
    return response.json(users)
  }

  public async create({ request, response }: HttpContextContract) {
    const updateUserSchema = schema.create({
      name: schema.string(),
      price: schema.number(),
      available_credits: schema.number(),
    })

    const payload = await request.validate({ schema: updateUserSchema })
    const user = await Credit.create(payload)
    return response.json(user)
  }

  @bind()
  public async update({ request, response }: HttpContextContract, user: Credit) {
    const updateUserSchema = schema.create({
      name: schema.string(),
      price: schema.number(),
      available_credits: schema.number(),
    })

    const payload = await request.validate({ schema: updateUserSchema })
    user.merge(payload)
    await user.save()
    return response.json(user)
  }

  @bind()
  public async delete({ response }: HttpContextContract, user: Credit) {
    await user.delete()
    return response.status(200)
  }
}
