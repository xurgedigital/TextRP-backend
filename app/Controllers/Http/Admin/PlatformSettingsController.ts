// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import PlatformSetting from 'App/Models/PlatformSetting'
import { bind } from '@adonisjs/route-model-binding'
import { schema } from '@ioc:Adonis/Core/Validator'

export default class PlatformSettingsController {
  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const users = await PlatformSetting.query().paginate(page, limit)
    users.baseUrl('/admin/platform_settings')
    return response.json(users)
  }

  public async create({ request, response }: HttpContextContract) {
    const updateUserSchema = schema.create({
      key: schema.string(),
      value: schema.string(),
    })

    const payload = await request.validate({ schema: updateUserSchema })
    const user = await PlatformSetting.create(payload)
    return response.json(user)
  }

  @bind()
  public async update({ request, response }: HttpContextContract, user: PlatformSetting) {
    const updateUserSchema = schema.create({
      key: schema.string(),
      value: schema.string(),
    })

    const payload = await request.validate({ schema: updateUserSchema })
    user.merge(payload)
    await user.save()
    return response.json(user)
  }

  @bind()
  public async delete({ response }: HttpContextContract, user: PlatformSetting) {
    await user.delete()
    return response.status(200)
  }
}
