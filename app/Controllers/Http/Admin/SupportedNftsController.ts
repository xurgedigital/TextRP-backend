// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import SupportedNft from 'App/Models/SupportedNft'
import { bind } from '@adonisjs/route-model-binding'
import { schema } from '@ioc:Adonis/Core/Validator'

export default class SupportedNftsController {
  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const users = await SupportedNft.query().paginate(page, limit)
    users.baseUrl('/admin/supported_nfts')
    return response.json(users)
  }

  public async create({ request, response }: HttpContextContract) {
    const updateUserSchema = schema.create({
      title: schema.string(),
      description: schema.string(),
      contract_address: schema.string(),
      taxon: schema.string(),
    })

    const payload = await request.validate({ schema: updateUserSchema })
    const user = await SupportedNft.create(payload)
    return response.json(user)
  }

  @bind()
  public async update({ request, response }: HttpContextContract, user: SupportedNft) {
    const updateUserSchema = schema.create({
      title: schema.string(),
      description: schema.string(),
      contract_address: schema.string(),
      taxon: schema.string(),
    })

    const payload = await request.validate({ schema: updateUserSchema })
    user.merge(payload)
    await user.save()
    return response.json(user)
  }

  @bind()
  public async delete({ response }: HttpContextContract, user: SupportedNft) {
    await user.delete()
    return response.status(200)
  }
}
