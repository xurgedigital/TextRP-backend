// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import XummService from 'App/Services/XummService'
import UserToken from 'App/Models/UserToken'
import { DateTime } from 'luxon'
import * as crypto from 'crypto'
import Env from '@ioc:Adonis/Core/Env'
import User from 'App/Models/User'
import Payment from 'App/Models/Payment'
import UserCredit from 'App/Models/UserCredit'

export interface WebhookData {
  meta: Meta
  custom_meta: CustomMeta
  payloadResponse: PayloadResponse
  userToken?: UserTokenInterface
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
  TransactionType: string
  Destination: string
  Amount: number
}

export default class AuthController {
  public async login({ session, auth }) {
    try {
      await auth.use('web').authenticate()
      const user = await auth.use('web').user
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
    if (payload?.payload?.tx_type !== 'Payment') {
      const payloadUUID = payload?.meta?.uuid
      const paymentData = await Payment.findBy('uuid', payloadUUID)
      try {
        if (!paymentData) {
          return response.json({ error: 'Payment data not found!' })
        }
        const paymentPayload: PaymentPayload = JSON.parse(paymentData.payload)
        if (
          paymentPayload.Destination === payload?.payload?.request_json?.Destination &&
          payload?.payload?.request_json?.Amount === paymentPayload.Amount
        ) {
          const userCredit = await UserCredit.query().where('userId', paymentData.userId).first()
          if (!userCredit) {
            return response.json({ error: 'User Credit data not found!' })
          }
          userCredit.balance = userCredit.balance + paymentPayload.Amount
          await userCredit.save()
        }
      } catch (error) {
        if (paymentData) {
          paymentData.errorDetails = error
          await paymentData.save()
        }
      }
    }
    return response.status(200)
  }
}
