import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Twilio from 'twilio'
import TwilioConfig from 'Config/twilio'
import User from 'App/Models/User'
import { bind } from '@adonisjs/route-model-binding'
import Conversations from 'App/Models/Conversations'
import UserMessages from 'App/Models/UserMessages'

export enum MessageTypeEnum {
  TEXT = 'TEXT',
  MEDIA = 'MEDIA',
}
export interface TwilioConfigType {
  TWILIO_ACCOUNT_SID: string
  TWILIO_AUTH_TOKEN: string
}
export default class TwilioController {
  private client = Twilio(TwilioConfig.TWILIO_ACCOUNT_SID, TwilioConfig.TWILIO_AUTH_TOKEN)

  @bind()
  public async sendMessage(
    { auth, request, response }: HttpContextContract,
    conversation: Conversations
  ) {
    const authUser = await auth.use('web').user
    await authUser?.load('participants')
    const { message } = request.body()
    const messageResponse = this.client.conversations.v1
      .conversations(conversation.platformConverstionId)
      .messages.create({ author: authUser?.name, body: message })

    await UserMessages.create({
      conversationId: conversation.id,
      messagetype: MessageTypeEnum.TEXT,
      content: message,
    })
    return response.json(messageResponse)
  }

  public async startConversation({ auth, request, response }: HttpContextContract) {
    const authUser = await auth.use('web').user
    await authUser?.load('participants')
    const { conversationName } = request.body()
    const conversation = await this.client.conversations.v1.conversations.create({
      friendlyName: conversationName,
    })

    return response.json(conversation)
  }

  @bind()
  public async addParticipantToConversation(
    { auth, request, response }: HttpContextContract,
    conversations: Conversations
  ) {
    const authUser = await auth.use('web').user
    await authUser?.load('participants')
    await authUser?.participants?.load('identifiers')
    const { walletAddress } = request.body()
    const receiverUser = await User.query().where('address', walletAddress).first()
    if (!receiverUser) {
      return response.status(404).json({ error: 'Reciver wallet address not found!' })
    }
    await receiverUser.load('participants')
    if (!receiverUser.participants) {
      // client.conversations.v1.users
      //                  .create({identity: receiverUser.walletAddress})
      //                  .then(user => console.log(user.sid));
      // createIdentifiers
      // use address as identifier for participant
      // client.conversations.v1.conversations('CHXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
      //                  .participants
      //                  .create({identity: '<Chat User Identity>'})
      //                  .then(participant => console.log(participant.sid));
      // createParticipants
    }
    await receiverUser.participants.load('identifiers')
    const conversation = await this.client.conversations.v1
      .conversations(conversations.platformConverstionId)
      .participants.create({ identity: receiverUser.address })

    return response.json(conversation)
  }
}
