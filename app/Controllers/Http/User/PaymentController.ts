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
import { RippleAPI } from 'ripple-lib'

const senderAddress = 'rUZf4vHhLJYGaY3MjtqGcd8cwiimH3aQzw' // Replace with your sender address
const senderSecretKey = 'sEd7ZjVAeAY58rwYVokvzsRALmgV8x4' // Replace with your sender secret key
const api = new RippleAPI({ server: 'wss://s.altnet.rippletest.net:51233/' })

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
    const address = params.address
    const { message, amount } = request.only(['message', 'amount'])
    try {
      // Connect to the Ripple network
      // Replace with your preferred Ripple server URL
      await api.connect()
      console.log('Connected to the Ripple network')

      // Retrieve the sender's account information (to check the XRP balance)
      const senderAccountInfo = await api.getAccountInfo(senderAddress)
      console.log('Sender XRP balance:', senderAccountInfo.xrpBalance)

      console.log('!!!!!!!!', Buffer.from(message, 'utf-8').toString('hex'))

      // Prepare the transaction
      const preparedTx = await api.preparePayment(senderAddress, {
        source: {
          address: senderAddress,
          maxAmount: {
            value: amount,
            currency: 'XRP',
          },
        },
        destination: {
          address: address,
          amount: {
            value: amount,
            currency: 'XRP',
          },
        },
        memos: [
          {
            data: Buffer.from(message, 'utf-8').toString('hex'),
          },
        ],
      })

      // Sign the transaction with the sender's secret key
      const signedTx = api.sign(preparedTx.txJSON, senderSecretKey)

      // Submit the signed transaction to the Ripple network
      const txResponse = await api.submit(signedTx.signedTransaction)
      console.log('Transaction Response:', txResponse)

      // Disconnect from the Ripple network
      await api.disconnect()
      console.log('Disconnected from the Ripple network')
      return { success: 'amount transfered' }
    } catch (error) {
      console.error('Error:', error)
      throw new UnProcessableException(
        error ? error.toString() : 'issue while processing the transaction'
      )
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
    return this.processPaymentWallet(
      authUser,
      params.credit,
      paymentType,
      Math.floor(Math.random() * 1000000 + 1),
      address
    )
  }
  public async processPaymentWallet(
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

    const amount = paymentAmount * 1000000
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
    console.log('JJJJJJJJJJKKKKKKK', destination)

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
