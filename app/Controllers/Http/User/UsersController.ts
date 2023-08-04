import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import User from 'App/Models/User'
import UserExternalId from 'App/Models/UserExternalId'

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

  public async fromAddress({ response, request }: HttpContextContract) {
    let address = request.input('address')
    if (address.length !== 34) {
      console.log('address', address)
      const externalUser = await UserExternalId.query()
        .where('user_id', address)
        .where('auth_provider', 'oidc-xumm')
        .firstOrFail()
      address = externalUser.externalId
    }
    const authUser = await User.firstOrCreate(
      {
        address: address,
      },
      {}
    )
    if (authUser) await loadUserData(authUser)

    return response.json({ user: authUser, address })
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
