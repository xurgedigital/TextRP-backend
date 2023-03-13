import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import User from 'App/Models/User'

export default class UsersController {
  public async index({ response, auth }: HttpContextContract) {
    const authUser = await auth.use('web').user
    const user = await User.query()
      .preload('discount')
      .preload('subscriptions')
      .preload('credit')
      .where('id', authUser?.id || 0)
      .first()

    return response.json(user)
  }

  public async update({ request, response, auth }: HttpContextContract) {
    await auth.use('web').authenticate()
    const user = await auth.use('web').user
    if (!user) {
      response.abort(
        JSON.stringify({
          failed: true,
        }),
        401
      )
      return
    }
    const updateUserSchema = schema.create({
      name: schema.string(),
    })

    const payload = await request.validate({ schema: updateUserSchema })
    user.merge(payload)
    await user.save()
    return response.json(user)
  }
}
