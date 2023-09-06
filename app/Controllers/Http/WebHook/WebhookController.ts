import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import { rules } from '@adonisjs/validator/build/src/Rules'
import Env from '@ioc:Adonis/Core/Env'
import UserCredit from 'App/Models/UserCredit'
import Database from '@ioc:Adonis/Lucid/Database'
import UserExternalId from 'App/Models/UserExternalId'
import PlatformSetting from 'App/Models/PlatformSetting'
import User from 'App/Models/User'

export default class WebhookController {
  public async update({ request, response }: HttpContextContract) {
    console.log('webhook initiated')

    const webhookPassword = Env.get('WEBHOOK_SECRET')
    const updateUserSchema = schema.create({
      service: schema.enum(['discord', 'twitter', 'twilio'] as const),
      network: schema.string.nullable(),
      type: schema.enum(['receive', 'send'] as const),
      address: schema.string(),
      password: schema.string([rules.equalTo(webhookPassword)]),
    })

    const payload = await request.validate({ schema: updateUserSchema })

    console.log('payload', payload)

    let address = payload.address
    if (address.length !== 34) {
      const externalUser = await UserExternalId.query()
        .where('user_id', address)
        .where('auth_provider', 'oidc-xumm')
        .firstOrFail()
      address = externalUser.externalId
    }
    console.log('new address', address)
    // const enableVerification = Env.get('VERIFY_NFT', false)
    // if (enableVerification) {
    //   const verified = await NFTController.verifyHolding(address, payload.service, payload.network)
    //   if (!verified) response.status(403)
    // }

    const credit = await UserCredit.query().where('address', address).firstOrFail()

    console.log('credit', credit)

    const user: any = await User.query().where('id', credit.userId).firstOrFail()

    console.log('user', user)

    response.abortIf(user.balance < 0, 'Not Enough Balance', 403)
    const setting = await PlatformSetting.query()
      .where('key', `${payload.service}_${payload.type}`)
      .firstOrFail()
    const trx = await Database.transaction()
    await UserCredit.query()
      .useTransaction(trx)
      .forUpdate()
      .whereHas('user', (q) => q.where('address', address))
      .update('balance', parseFloat(String(user.balance)) - parseFloat(setting.value))

    await trx.commit()
    return response.status(200)
  }
}
