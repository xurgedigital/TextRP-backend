import Subscription from 'App/Models/Subscription'
import Credit from 'App/Models/Credit'
// import { XummSdk } from 'xumm-sdk'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Payment from 'App/Models/Payment'
import XummService from 'App/Services/XummService'
import PlatformSetting from 'App/Models/PlatformSetting'
import Logger from '@ioc:Adonis/Core/Logger'
import { XummPostPayloadBodyJson } from 'xumm-sdk/dist/src/types/xumm-api'
import NotFoundException from 'App/Exceptions/NotFoundException'
import UnProcessableException from 'App/Exceptions/UnProcessableException'
import AuthorizationException from 'App/Exceptions/AuthorizationException'
import User from 'App/Models/User'
import UserExternalId from 'App/Models/UserExternalId'
// import { Duration } from 'luxon'
// const XUMM = new XummSdk(
//   'b19848bd-6133-4267-aa72-2bb4a5183893',
//   '0ec479fd-5241-4002-b599-99cfc453b6ad'
// )
export enum PaymentTypeEnum {
  CREDIT = 'CREDIT',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

export default class PaymentController {
  public async subscriptionPayment({ auth, params }: HttpContextContract) {
    if (!params.subscription) {
      throw new UnProcessableException('Please provide subscriptionID in params!')
    }
    const subscription = await Subscription.find(params.subscription)
    if (!subscription) {
      throw new NotFoundException('Subscription not found!')
    }
    const { id, price } = subscription
    const paymentType = PaymentTypeEnum.SUBSCRIPTION
    const authUser = await auth.use('web').user
    if (!authUser) {
      throw new AuthorizationException('Auth User does not exists')
    }
    return this.processPayment(authUser, price, paymentType, id)
  }

  public async createSubscription({ request, params }: HttpContextContract) {
    let address = request.input('address')
    if (address.length !== 34) {
      const externalUser = await UserExternalId.query()
        .where('user_id', address)
        .where('auth_provider', 'oidc-xumm')
        .firstOrFail()
      address = externalUser.externalId
    }
    if (!params.subscription) {
      throw new UnProcessableException('Please provide subscriptionID in params!')
    }
    const subscription = await Subscription.find(params.subscription)
    if (!subscription) {
      throw new NotFoundException('Subscription not found!')
    }
    const { id, price } = subscription
    const paymentType = PaymentTypeEnum.SUBSCRIPTION
    const authUser = await User.firstOrCreate(
      {
        address: address,
      },
      {}
    )
    if (!authUser) {
      throw new AuthorizationException('Auth User does not exists')
    }
    return this.processPayment(authUser, price, paymentType, id)
  }

  public async creditPayment({ auth, params }: HttpContextContract) {
    if (!params.credit) {
      throw new UnProcessableException('Please provide creditID in params!')
    }
    const credit = await Credit.find(params.credit)
    if (!credit) {
      throw new NotFoundException('Credit not found!')
    }
    const { id, price } = credit
    const paymentType = PaymentTypeEnum.CREDIT
    const authUser = await auth.use('web').user
    if (!authUser) {
      throw new AuthorizationException('Auth User does not exists')
    }
    return this.processPayment(authUser, price, paymentType, id)
  }
  public async transferPayment({ request, params }: HttpContextContract) {
    const address = params.address
    const { message, amount } = request.only(['message', 'amount'])
    const buffer = Buffer.from(message, 'utf-8')

    // Convert the Buffer to a hexadecimal string
    const hexString = buffer.toString('hex')

    const payload: any = {
      txjson: {
        TransactionType: 'Payment',
        Destination: address, // Replace with the actual destination account address
        Amount: amount, // Replace with the amount in drops (XRP) you want to send
        Fee: '12', // Replace with the transaction fee in drops
        Memos: [
          {
            Memo: {
              //"MemoType": 'hex', // Can be 'text', 'hex', or 'json'
              // "MemoData": "F09F94A520546563686E6F7469702E636F6D"
              MemoData: hexString,
            },
          },
        ],
        //  Sequence: '12345', // Replace with the next sequence number of the source account
      },
    }
    try {
      const ping = await XummService.sdk.payload.create(payload)
      return { data: ping }
    } catch (e) {
      throw new UnProcessableException('UUID not returned by xumm')
    }
  }

  public async createPayment({ request, params }: HttpContextContract) {
    let address = request.input('address')
    if (address.length !== 34) {
      const externalUser = await UserExternalId.query()
        .where('user_id', address)
        .where('auth_provider', 'oidc-xumm')
        .firstOrFail()
      address = externalUser.externalId
    }
    if (!params.credit) {
      throw new UnProcessableException('Please provide creditID in params!')
    }
    const credit = await Credit.find(params.credit)
    if (!credit) {
      throw new NotFoundException('Credit not found!')
    }
    const { id, price } = credit
    const paymentType = PaymentTypeEnum.CREDIT
    const authUser = await User.firstOrCreate(
      {
        address: address,
      },
      {}
    )
    return this.processPayment(authUser, price, paymentType, id)
  }

  public async processPayment(
    authUser: User,
    paymentAmount: number,
    paymentType: PaymentTypeEnum,
    entityId: number
  ) {
    let destination
    try {
      destination = (await PlatformSetting.query().where('key', 'receiveWallet').firstOrFail())
        .value
    } catch (error) {
      throw new NotFoundException('Wallet not found in platform settings')
    }
    await authUser.load('discount')

    const discoutAmount = (authUser.discount?.discount || 0) / 100
    const amount = (paymentAmount - paymentAmount * discoutAmount) * 10 ** 6
    const payload: XummPostPayloadBodyJson = {
      txjson: {
        TransactionType: 'Payment',
        Destination: destination,
        Amount: amount.toString(),
      },
    }
    const ping = await XummService.sdk.payload.create(payload).catch((error) => {
      Logger.error(error)
      throw new UnProcessableException('Error while creating payment from Xumm')
    })
    Logger.debug(
      {
        ping,
        payload,
        discoutAmount,
      },
      'Ping response with payload'
    )
    if (!ping?.uuid) {
      throw new UnProcessableException('UUID not returned by xumm')
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
