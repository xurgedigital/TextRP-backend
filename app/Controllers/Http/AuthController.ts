// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import XummService from 'App/Services/XummService'

export default class AuthController {
  public async login() {
    const ping = await XummService.sdk.payload.create({
      txjson: {
        TransactionType: 'SignIn',
      },
    })
    return { data: ping }
  }
}
