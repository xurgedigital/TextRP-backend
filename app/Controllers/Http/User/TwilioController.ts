import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Twilio from 'twilio'
import TwilioConfig from 'Config/twilio'
import User from 'App/Models/User'

export interface TwilioConfigType {
  TWILIO_ACCOUNT_SID: string
  TWILIO_AUTH_TOKEN: string
}
export default class TwilioController {
  private client = Twilio(TwilioConfig.TWILIO_ACCOUNT_SID, TwilioConfig.TWILIO_AUTH_TOKEN)

  public async sendMessage({ auth, request, response }: HttpContextContract) {
    const authUser = await auth.use('web').user
    await authUser?.load('participants')
    const { walletAddress, message } = request.body()
    const receiverUser = await User.query().where('address', walletAddress).first()
    if (receiverUser) {
      return response.status(404).json({ error: 'Reciver wallet address not found!' })
    }
    const twilioReply = await this.client.messages.create({
      body: message,
      from: '',
      to: '',
    })

    return { twilioReply }
  }
}
