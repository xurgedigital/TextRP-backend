import Credit from 'App/Models/Credit'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { bind } from '@adonisjs/route-model-binding'
import Payment from 'App/Models/Payment'
import XummService from 'App/Services/XummService'

export default class PaymentController {
  @bind()
  public async payment({ auth }: HttpContextContract, credit: Credit) {
    const destination = 'rwgF3T6VXAsExTZMXM2xpRhKVYmktu4t4P'
    const authUser = await auth.use('web').user
    const ping = await XummService.sdk.payload.create({
      txjson: {
        TransactionType: 'Payment',
        Destination: destination,
        Amount: credit.price,
      },
    })
    const payload = {
      txjson: {
        TransactionType: 'Payment',
        Destination: destination,
        Amount: credit.price,
      },
    }
    await Payment.firstOrCreate(
      {
        userId: authUser?.id,
        uuid: ping?.uuid,
        payload: JSON.stringify(payload),
      },
      {}
    )
    return { data: ping }
  }
}
