import Env from '@ioc:Adonis/Core/Env'

export interface TwilioConfigType {
  TWILIO_ACCOUNT_SID: string
  TWILIO_AUTH_TOKEN: string
  TWILIO_CHAT_SERVICE_SID: string
  TWILIO_PUSH_CREDENTIAL_SID: string
  TWILIO_API_KEY_SID: string
  TWILIO_API_KEY_SECRET: string
  WEBHOOK_URL: string
}

const TwilioConfig: TwilioConfigType = {
  TWILIO_ACCOUNT_SID: Env.get('TWILIO_ACCOUNT_SID'),
  TWILIO_AUTH_TOKEN: Env.get('TWILIO_AUTH_TOKEN'),
  TWILIO_CHAT_SERVICE_SID: Env.get('TWILIO_CHAT_SERVICE_SID'),
  TWILIO_PUSH_CREDENTIAL_SID: Env.get('TWILIO_PUSH_CREDENTIAL_SID'),
  TWILIO_API_KEY_SID: Env.get('TWILIO_API_KEY_SID'),
  TWILIO_API_KEY_SECRET: Env.get('TWILIO_API_KEY_SECRET'),
  WEBHOOK_URL: Env.get('WEBHOOK_URL'),
}

export default TwilioConfig
