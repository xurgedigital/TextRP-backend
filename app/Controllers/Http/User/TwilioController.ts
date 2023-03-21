import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Twilio from 'twilio'
import TwilioConfig from 'Config/twilio'
import User from 'App/Models/User'
import { bind } from '@adonisjs/route-model-binding'
import Conversations from 'App/Models/Conversations'
import UserMessages from 'App/Models/UserMessages'
import Identifiers from 'App/Models/Identifiers'
import Participants from 'App/Models/Participants'

export enum MessageTypeEnum {
  TEXT = 'TEXT',
  MEDIA = 'MEDIA',
}

export enum ServiceNameEnum {
  TWILIO = 'TWILIO',
}

interface ParticipantAttribute {
  identifierId: number
  uuid: string
}
export interface TwilioConfigType {
  TWILIO_ACCOUNT_SID: string
  TWILIO_AUTH_TOKEN: string
  WEBHOOK_URL: string
}
export default class TwilioController {
  private client = Twilio(TwilioConfig.TWILIO_ACCOUNT_SID, TwilioConfig.TWILIO_AUTH_TOKEN)

  @bind()
  public async sendMessage(
    { auth, request, response }: HttpContextContract,
    conversation: Conversations
  ) {
    const authUser = await auth.use('web').user
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

  public async recieveMessage(
    { request, response }: HttpContextContract,
    conversation: Conversations
  ) {
    const { message } = request.body()
    // const messageResponse = this.client.conversations.v1
    //   .conversations(conversation.platformConverstionId)
    //   .webhooks.create({
    //     target: TwilioConfig.WEBHOOK_URL,
    //     type: 'webhook',
    //     configuration: {
    //       method: 'POST',
    //       filters: ['onMessageSent'],
    //     },
    //   })
    //   .then((webhook) => console.log(webhook.sid))
    await UserMessages.create({
      conversationId: conversation.id,
      messagetype: MessageTypeEnum.TEXT,
      content: message,
    })
    // return response.json(messageResponse)
  }

  @bind()
  public async startConversation(
    { request, response }: HttpContextContract,
    conversations: Conversations
  ) {
    const { walletAddress } = request.body()
    const receiverUser = await User.query().where('address', walletAddress).first()
    if (!receiverUser) {
      return response.status(404).json({ error: 'Reciver wallet address not found!' })
    }
    await receiverUser.load('identifiers')
    let participantAttribute: ParticipantAttribute
    if (!receiverUser.identifiers) {
      const conversationUser = await this.client.conversations.v1.users.create({
        identity: receiverUser.address,
      })
      const identifier = await Identifiers.create({
        uuid: conversationUser.sid,
        address: receiverUser.address,
        serviceName: ServiceNameEnum.TWILIO,
        userId: receiverUser.id,
      })
      participantAttribute = {
        identifierId: identifier.id,
        uuid: identifier.uuid,
      }
    } else {
      participantAttribute = {
        identifierId: receiverUser.identifiers.id,
        uuid: receiverUser.identifiers.uuid,
      }
    }
    const conversationParticipant = await this.client.conversations.v1
      .conversations(conversations.platformConverstionId)
      .participants.create({
        identity: receiverUser.name,
        attributes: JSON.stringify(participantAttribute),
      })
    await Participants.create({
      identifierId: participantAttribute.identifierId,
      conversationId: conversations.id,
      uuid: conversationParticipant.sid,
    })
    return response.json(conversationParticipant)
  }
}
