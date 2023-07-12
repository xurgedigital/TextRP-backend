import { PaymentTypeEnum } from 'App/Controllers/Http/User/PaymentController'
import XummService from 'App/Services/XummService'
import UserToken from 'App/Models/UserToken'
import { DateTime } from 'luxon'
import * as crypto from 'crypto'
import Env from '@ioc:Adonis/Core/Env'
import User from 'App/Models/User'
import Payment from 'App/Models/Payment'
import UserCredit from 'App/Models/UserCredit'
import Logger from '@ioc:Adonis/Core/Logger'
import Credit from 'App/Models/Credit'
import Subscription from 'App/Models/Subscription'
import UserSubscription from 'App/Models/UserSubscription'
import moment from 'moment'

export interface WebhookData {
  meta: Meta
  custom_meta: CustomMeta
  payloadResponse: PayloadResponse
  userToken?: UserTokenInterface
  creditId?: number
}

export interface CustomMeta {
  identifier: null
  blob: null
  instruction: null | string
}

export interface Meta {
  url: string
  application_uuidv4: string
  payload_uuidv4: string
  opened_by_deeplink: boolean
}

export interface PayloadResponse {
  payload_uuidv4: string
  reference_call_uuidv4: string
  signed: boolean
  user_token: boolean
  return_url: ReturnURL
  txid: string
}

export interface ReturnURL {
  app: null
  web: null | string
}

export interface UserTokenInterface {
  user_token: string
  token_issued: number
  token_expiration: number
}

export interface PaymentPayload {
  txjson: {
    TransactionType: string
    Destination: string
    Amount: number
  }
}

export default class AuthController {
  public async login({ session, auth }) {
    try {
      await auth.use('web').authenticate()
      const user = await auth.use('web').user
      if (!user?.isActive) {
        throw 'User is inactive'
      }
      return { me: user }
    } catch (e) {}
    const sessionUuid = session.get('current_uuid')
    if (sessionUuid) {
      const userToken = await UserToken.query().where('uuid', sessionUuid).preload('user').first()
      if (userToken?.token) {
        /**
         * Login user using the web guard
         */
        if (userToken?.user) await auth.use('web').login(userToken?.user)
        return { me: userToken?.user }
      }
    }

    const ping = await XummService.sdk.payload.create({
      txjson: {
        TransactionType: 'SignIn',
      },
    })
    session.put('current_uuid', ping?.uuid)
    await UserToken.firstOrCreate(
      {
        uuid: ping?.uuid,
      },
      {}
    )
    return { data: ping }
  }

  public async webhook({ request, response }) {
    const timestamp = request.header('x-xumm-request-timestamp') || ''
    const data = <WebhookData>request.body()
    const hmac = crypto
      .createHmac('sha1', Env.get('XUMM_APISECRET').replace('-', ''))
      .update(timestamp + JSON.stringify(data))
      .digest('hex')

    response.abortUnless(
      hmac === request.header('x-xumm-request-signature'),
      'Invalid Signature',
      401
    )
    const payload = await XummService.sdk.payload.get(data.payloadResponse.payload_uuidv4)
    Logger.debug('Payload', {
      payload,
    })
    if (payload?.response?.account && payload?.payload?.tx_type === 'SignIn') {
      await User.firstOrCreate(
        {
          address: payload?.response?.account,
        },
        {}
      )
    }
    if (data.userToken && payload?.response?.account && payload?.payload?.tx_type !== 'Payment') {
      await User.firstOrCreate(
        {
          address: payload?.response?.account,
        },
        {}
      )
      await UserToken.updateOrCreate(
        {
          uuid: data.payloadResponse.payload_uuidv4,
        },
        {
          user_address: payload?.response?.account || undefined,
          token: data.userToken.user_token,
          expiresAt: DateTime.fromSeconds(data.userToken.token_expiration),
        }
      )
    }
    if (payload?.payload?.tx_type === 'Payment') {
      const payloadUUID = payload?.meta?.uuid
      const paymentRepository = await Payment.findBy('uuid', payloadUUID)
      try {
        if (!paymentRepository) {
          return response.status(422).json({ error: 'Payment data not found!' })
        }
        const paymentPayload: PaymentPayload = JSON.parse(paymentRepository.payload)
        if (
          paymentPayload.txjson.Destination === payload?.payload?.request_json?.Destination &&
          String(payload?.payload?.request_json?.Amount) === String(paymentPayload.txjson.Amount)
        ) {
          if (paymentRepository.paymenttableType === PaymentTypeEnum.CREDIT) {
            const userCredit = await UserCredit.firstOrCreate({
              userId: paymentRepository.userId,
            })
            const credit = await Credit.findOrFail(paymentRepository.paymenttableId)
            userCredit.balance =
              parseFloat(String(userCredit.balance || '0')) +
                parseFloat(String(credit.available_credits)) || 0
            await userCredit.save()
          } else if (paymentRepository.paymenttableType === PaymentTypeEnum.SUBSCRIPTION) {
            const subscription = await Subscription.findOrFail(paymentRepository.paymenttableId)
            let months = 1
            if (subscription.name.includes('quarterly')) {
              months = 3
            } else if (subscription.name.includes('semi-annually')) {
              months = 6
            } else if (subscription.name.includes('annually')) {
              months = 12
            }
            await UserSubscription.create({
              userId: paymentRepository.userId,
              subscriptionId: subscription.id,
              expires_at: DateTime.fromJSDate(moment().add(months, 'months').toDate()),
            })
          }
        }
      } catch (error) {
        if (paymentRepository) {
          // paymentRepository.errorDetails = error
          // await paymentRepository.save()
        }
        console.error('Error while webhook', error)
        Logger.error({ error }, 'Error while webhook')
        return response.status(500)
      }
    }
    return response.status(200)
  }
}
