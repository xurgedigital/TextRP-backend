import Env from '@ioc:Adonis/Core/Env'
import { TwilioConfigType } from 'App/Controllers/Http/User/TwilioController'

const TwilioConfig: TwilioConfigType = {
  TWILIO_ACCOUNT_SID: Env.get('TWILIO_ACCOUNT_SID'),
  TWILIO_AUTH_TOKEN: Env.get('TWILIO_AUTH_TOKEN'),
  WEBHOOK_URL: Env.get('WEBHOOK_URL'),
}

export default TwilioConfig
