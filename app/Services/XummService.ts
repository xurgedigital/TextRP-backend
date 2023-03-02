import { XummSdk } from 'xumm-sdk'
import Env from '@ioc:Adonis/Core/Env'

class XummService {
  public sdk: XummSdk // 👈 1. maintain a count
  constructor() {
    this.sdk = new XummSdk(Env.get('XUMM_APIKEY'), Env.get('XUMM_APISECRET'))
  }
}
export default new XummService() // 👈 4. export as a singleton
