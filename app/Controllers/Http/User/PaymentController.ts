import Subscription from 'App/Models/Subscription'
import Credit from 'App/Models/Credit'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { bind } from '@adonisjs/route-model-binding'
import Payment from 'App/Models/Payment'
import XummService from 'App/Services/XummService'
import PlatformSetting from 'App/Models/PlatformSetting'

export enum PaymentTypeEnum {
  CREDIT = 'CREDIT',
  SUBSCRIPTION = 'SUBSCRIPTION',
}
export default class PaymentController {
  @bind()
  public async subscriptionPayment({ auth }: HttpContextContract, subscription: Subscription) {
    const { id, price } = subscription
    const paymentType = PaymentTypeEnum.SUBSCRIPTION
    return this.processPayment(auth, price, paymentType, id)
  }

  @bind()
  public async creditPayment({ auth }: HttpContextContract, credit: Credit) {
    const { id, price } = credit
    const paymentType = PaymentTypeEnum.CREDIT
    return this.processPayment(auth, price, paymentType, id)
  }

  public async processPayment(
    auth,
    paymentAmount: number,
    paymentType: PaymentTypeEnum,
    entityId: number
  ) {
    const destination = (await PlatformSetting.query().where('key', 'wallet_address').firstOrFail())
      .value
    const authUser = await auth.use('web').user
    await authUser?.load('discount')
    const discoutAmount = (authUser?.discount.discount || 0) / 100
    const amount = paymentAmount - paymentAmount * discoutAmount
    const ping = await XummService.sdk.payload.create({
      txjson: {
        TransactionType: 'Payment',
        Destination: destination,
        Amount: amount,
      },
    })
    const payload = {
      txjson: {
        TransactionType: 'Payment',
        Destination: destination,
        Amount: amount,
      },
    }
    await Payment.firstOrCreate(
      {
        userId: authUser?.id,
        uuid: ping?.uuid,
        payload: JSON.stringify(payload),
        paymenttableId: entityId,
        paymenttableType: paymentType,
      },
      {}
    )
    return { data: ping }
  }
}
