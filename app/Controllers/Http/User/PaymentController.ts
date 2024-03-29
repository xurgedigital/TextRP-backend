import Subscription from 'App/Models/Subscription'
import Credit from 'App/Models/Credit'
// import { XummSdk } from 'xumm-sdk'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Payment from 'App/Models/Payment'
import XummService from 'App/Services/XummService'
import PlatformSetting from 'App/Models/PlatformSetting'
import Logger from '@ioc:Adonis/Core/Logger'
import { GetAllConfigs } from '../GetConfig'
import { XummPostPayloadBodyJson } from 'xumm-sdk/dist/src/types/xumm-api'
import NotFoundException from 'App/Exceptions/NotFoundException'
import UnProcessableException from 'App/Exceptions/UnProcessableException'
import AuthorizationException from 'App/Exceptions/AuthorizationException'
import User from 'App/Models/User'
import UserExternalId from 'App/Models/UserExternalId'
const xrpl = require('xrpl')
const senderAddress = 'rUZf4vHhLJYGaY3MjtqGcd8cwiimH3aQzw' // Replace with your sender address
const senderSecretKey = 'sEd7ZjVAeAY58rwYVokvzsRALmgV8x4' // Replace with your sender secret key

// import { Duration } from 'luxon'
// const XUMM = new XummSdk(
//   'b19848bd-6133-4267-aa72-2bb4a5183893',
//   '0ec479fd-5241-4002-b599-99cfc453b6ad'
// )
export enum PaymentTypeEnum {
  CREDIT = 'CREDIT',
  SUBSCRIPTION = 'SUBSCRIPTION',
  WALLET_TRANSFER = 'WALLET_TRANSFER',
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
  public async transferWithSecretKey({ request, params }: HttpContextContract) {
    const NETWORK = await GetAllConfigs()
    const client = new xrpl.Client(NETWORK.WALLET)
    await client.connect()

    // Prepare transaction -————————————————-———————————»
    const wallet = xrpl.Wallet.fromSeed(senderSecretKey)

    const address = params.address
    const { message, amount } = request.only(['message', 'amount'])

    const prepared = await client.autofill({
      TransactionType: 'Payment',
      Account: senderAddress,
      Amount: xrpl.xrpToDrops(amount),
      Destination: address,
      message: message,
      Memos: [
        {
          Memo: {
            MemoData: Buffer.from(message, 'utf8').toString('hex'),
          },
        },
      ],
    })
    const maxLedger = prepared.LastLedgerSequence
    console.log('Prepared txn instructions : ', prepared)
    console.log('Txn cost:', xrpl.dropsToXrp(prepared.Fee), 'XRP')
    console.log('Txn expires after ledger: ', maxLedger)
    // sign prepared instruction ----
    const signed = wallet.sign(prepared)
    console.log('Identifying hash:', signed.hash)
    console.log('signed blob:', signed.tx_blob)
    try {
      const submitResult = await client.submitAndWait(signed.tx_blob)
      client.disconnect()
      return { submitResult }
    } catch (error) {
      client.disconnect()
      return { error: error }
    }
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
  public async makeTxn({ request, params }: HttpContextContract) {
    let address = request.input('address')
    let sender = request.input('sender')
    let currency = request.input('currency')
    if (address.length !== 34) {
      const externalUser = await UserExternalId.query()
        .where('user_id', address)
        .where('auth_provider', 'oidc-xumm')
        .firstOrFail()
      address = externalUser.externalId
    }

    if (!params.credit) {
      throw new UnProcessableException('Please provide total XRP in params!')
    }
    const paymentType = PaymentTypeEnum.WALLET_TRANSFER
    const authUser = await User.firstOrCreate(
      {
        address: address,
      },
      {}
    )
    console.log('YYYYYYYYYYYYY', address, currency)

    return this.processPaymentWallet(
      authUser,
      params.credit,
      currency,
      sender,
      paymentType,
      Math.floor(Math.random() * 1000000 + 1),
      address
    )
  }
  public async processPaymentWallet(
    authUser: User,
    paymentAmount: number,
    currency: string,
    sender: string,
    paymentType: PaymentTypeEnum,
    entityId: number,
    destinationAddress?: string
  ) {
    let destination
    try {
      if (destinationAddress) {
        destination = destinationAddress
      } else
        destination = (await PlatformSetting.query().where('key', 'receiveWallet').firstOrFail())
          .value
    } catch (error) {
      throw new NotFoundException('Wallet not found in platform settings')
    }
    await authUser.load('discount')

    const amount = paymentAmount
    const payload: XummPostPayloadBodyJson = {
      txjson: {
        TransactionType: 'Payment',
        Destination: destination,
        Amount: {
          value: amount.toString(),
          currency: currency,
          issuer: sender, // address of the entity issuing the currency
        },
      },
    }

    const ping = await XummService.sdk.payload.create(payload)
    Logger.debug(
      {
        ping,
        payload,
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
  public async processPayment(
    authUser: User,
    paymentAmount: number,
    paymentType: PaymentTypeEnum,
    entityId: number,
    destinationAddress?: string
  ) {
    let destination
    try {
      if (destinationAddress) {
        destination = destinationAddress
      } else
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
