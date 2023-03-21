import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import User from 'App/Models/User'

export const loadUserData = async (user: User): Promise<User> => {
  await user?.load('discount')
  await user?.load('subscriptions')
  await user?.load('credit')
  return user
}
export default class UsersController {
  public async index({ response, auth }: HttpContextContract) {
    const authUser = await auth.use('web').user
    if (authUser) await loadUserData(authUser)

    return response.json({ user: authUser })
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
      isActive: schema.boolean(),
      textRpUsername: schema.string(),
      about: schema.string(),
      profile_picture: schema.string(),
    })

    const payload = await request.validate({ schema: updateUserSchema })
    user.merge(payload)
    await user.save()
    return response.json(user)
  }
}
