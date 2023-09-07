import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import { rules } from '@adonisjs/validator/build/src/Rules'
import Env from '@ioc:Adonis/Core/Env'
import UserCredit from 'App/Models/UserCredit'
import UserExternalId from 'App/Models/UserExternalId'
import PlatformSetting from 'App/Models/PlatformSetting'
import User from 'App/Models/User'

export default class WebhookController {
  public async update({ request, response }: HttpContextContract) {
    console.log('webhook initiated')

    const webhookPassword = Env.get('WEBHOOK_SECRET')
    const updateUserSchema = schema.create({
      service: schema.enum(['discord', 'twitter', 'twilio'] as const),
      // network: schema.string.nullable(),
      type: schema.enum(['receive', 'send'] as const),
      address: schema.string(),
      password: schema.string([rules.equalTo(webhookPassword)]),
    })

    const payload = await request.validate({ schema: updateUserSchema })

    let address = payload.address
    if (address.length !== 34) {
      const externalUser = await UserExternalId.query()
        .where('user_id', address)
        .where('auth_provider', 'oidc-xumm')
        .firstOrFail()
      address = externalUser.externalId
    }

    const user: any = await User.query().where('address', address).firstOrFail()
    response.abortIf(!user, 'User Not Found', 403)

    const credit = await UserCredit.query().where('userId', user.id).firstOrFail()

    response.abortIf(credit.balance < 0, 'Not Enough Balance', 403)
    const setting = await PlatformSetting.query()
      .where('key', `${payload.service}_${payload.type}`)
      .firstOrFail()

    await UserCredit.updateOrCreate(
      { userId: credit.userId },
      { balance: parseFloat(String(credit.balance)) - parseFloat(setting.value) }
    )
    return response.status(200)
  }
}
