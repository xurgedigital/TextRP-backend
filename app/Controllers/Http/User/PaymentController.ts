import Subscription from 'App/Models/Subscription'
import Credit from 'App/Models/Credit'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { bind } from '@adonisjs/route-model-binding'
import Payment from 'App/Models/Payment'
import XummService from 'App/Services/XummService'
import PlatformSetting from 'App/Models/PlatformSetting'
import Logger from '@ioc:Adonis/Core/Logger'
import { XummPostPayloadBodyJson } from 'xumm-sdk/dist/src/types/xumm-api'

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
    let destination
    try {
      destination = (await PlatformSetting.query().where('key', 'receiveWallet').firstOrFail())
        .value
    } catch (error) {
      throw new Error('Wallet not found in platform settings')
    }
    const authUser = await auth.use('web').user
    await authUser?.load('discount')

    const discoutAmount = (authUser?.discount?.discount || 0) / 100
    const amount = (paymentAmount - paymentAmount * discoutAmount) * 10 ** 6
    const payload: XummPostPayloadBodyJson = {
      txjson: {
        TransactionType: 'Payment',
        Destination: destination,
        Amount: amount.toString(),
      },
    }
    const ping = await XummService.sdk.payload.create(payload)
    Logger.debug(
      {
        ping,
        payload,
        discoutAmount,
      },
      'Ping response with payload'
    )
    if (!ping?.uuid) {
      throw new Error('UUID not returned by xumm')
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
