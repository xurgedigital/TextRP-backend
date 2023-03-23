import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Twilio from 'twilio'
import TwilioConfig from 'Config/twilio'
import User from 'App/Models/User'
import { bind } from '@adonisjs/route-model-binding'
import Conversations from 'App/Models/Conversations'
import UserMessages from 'App/Models/UserMessages'
import Identifiers from 'App/Models/Identifiers'
import Participants from 'App/Models/Participants'
import Ws from 'App/Services/Ws'
import UserMessageRead from 'App/Models/UserMessageRead'
import { DateTime } from 'luxon'

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
  name: string
}
export interface TwilioConfigType {
  TWILIO_ACCOUNT_SID: string
  TWILIO_AUTH_TOKEN: string
  WEBHOOK_URL: string
}
export default class TwilioController {
  private client = Twilio(TwilioConfig.TWILIO_ACCOUNT_SID, TwilioConfig.TWILIO_AUTH_TOKEN)

  public async configureConversationWebHook(conversationId: string) {
    try {
      const webhook = await this.client.conversations.v1
        .conversations(conversationId)
        .webhooks.create({
          'configuration.method': 'POST',
          'configuration.filters': ['onMessageAdded', 'onParticipantAdded'],
          'configuration.triggers': ['onConversationStarted', 'onMessageSent'],
          'configuration.url': TwilioConfig.WEBHOOK_URL,
          'target': 'webhook',
        })
      return webhook
    } catch (error) {
      console.log(error)
    }
  }
  @bind()
  public async sendMessage(
    { auth, request, response }: HttpContextContract,
    conversation: Conversations
  ) {
    const authUser = await auth.use('web').user
    if (!authUser) {
      return response.status(404).json({ error: 'Auth user not found!' })
    }
    const { message } = request.body()
    const messageResponse = await this.client.conversations.v1
      .conversations(conversation.platformConverstionId)
      .messages.create({ author: authUser.name, body: message })
    const userMessage = await UserMessages.create({
      conversationId: conversation.id,
      messageType: MessageTypeEnum.TEXT,
      content: message,
      senderId: authUser.id,
    })
    Ws.io
      .to(`${conversation.platformConverstionId}`)
      .emit('messageNotification', { sender: authUser, userMessage })
    return response.json(messageResponse)
  }

  @bind()
  public async getAllMessagesFromConversation(
    { response }: HttpContextContract,
    conversation: Conversations
  ) {
    const messageResponse = await this.client.conversations.v1
      .conversations(conversation.platformConverstionId)
      .messages.list({ limit: 20 })

    return response.json(messageResponse)
  }

  public async recieveMessage({}: HttpContextContract) {
    // const { ConversationSid, Body, From, Index } = request.body()
    // Below is example payload
    // {
    //   "AccountSid": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    //   "ConversationSid": "CVXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    //   "ConversationEventSid": "CEXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    //   "From": "user",
    //   "To": "system",
    //   "Body": "Hello, world!",
    //   "MessageSid": "IMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    //   "MessagingServiceSid": "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    //   "DateCreated": "2023-03-22T12:34:56.000Z",
    //   "Index": 1,
    //   "EventType": "onMessageAdded",
    //   "Description": "A message was added to a conversation"
    // }
    //TODO: need to add MessageSid in usermessage
    // await UserMessages.create({
    //   conversationId: conversation.id,
    //   // messagetype: MessageTypeEnum.TEXT,
    //   content: message,
    // })
    // return response.json(messageResponse)
  }

  public async createConversation({ auth, request, response }: HttpContextContract) {
    const authUser = await auth.use('web').user
    if (!authUser) {
      return response.status(404).json({ error: 'Auth user not found!' })
    }
    const { conversationName } = request.body()
    const authUserIdentifier = await this.fetchOrCreateUserIdentifier(authUser)

    const conversationResponse = await this.client.conversations.v1.conversations.create({
      friendlyName: conversationName,
    })
    const conversation = await Conversations.create({
      identifierId: authUserIdentifier.id,
      creatorId: authUser.id,
      platformConverstionId: conversationResponse.sid,
      name: conversationName,
    })
    const participantAttribute: ParticipantAttribute = {
      identifierId: authUserIdentifier.id,
      uuid: authUserIdentifier.uuid,
      name: authUser.name,
    }

    const conversationParticipant = await this.addParticipantToConversation(
      conversation,
      participantAttribute
    )
    return response.json(conversationParticipant)
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
    const receiverUserIdentifier = await this.fetchOrCreateUserIdentifier(receiverUser)
    const participantAttribute: ParticipantAttribute = {
      identifierId: receiverUserIdentifier.id,
      uuid: receiverUserIdentifier.uuid,
      name: receiverUser.name,
    }

    const conversationParticipant = await this.addParticipantToConversation(
      conversations,
      participantAttribute
    )
    return response.json(conversationParticipant)
  }

  public async fetchOrCreateUserIdentifier(user: User): Promise<Identifiers> {
    await user.load('identifiers')
    if (user.identifiers) {
      return user.identifiers
    }
    const conversationUser = await this.client.conversations.v1.users.create({
      identity: user.address,
    })
    return await Identifiers.create({
      uuid: conversationUser.sid,
      address: user.address,
      serviceName: ServiceNameEnum.TWILIO,
      userId: user.id,
    })
  }

  public async addParticipantToConversation(
    conversations: Conversations,
    participantAttribute: ParticipantAttribute
  ) {
    try {
      const conversationParticipant = await this.client.conversations.v1
        .conversations(conversations.platformConverstionId)
        .participants.create({
          identity: participantAttribute.name,
          attributes: JSON.stringify(participantAttribute),
        })
      await Participants.create({
        identifierId: participantAttribute.identifierId,
        conversationId: conversations.id,
        uuid: conversationParticipant.sid,
      })
      const conversationWebhook = await this.configureConversationWebHook(
        conversations.platformConverstionId
      )

      Ws.io
        .to(`${conversations.platformConverstionId}`)
        .emit('newUserAddedToConversation', { userName: participantAttribute.name })
      return { conversationParticipant, conversationWebhook }
    } catch (error) {
      console.log(error)
    }
  }

  @bind()
  public async markMessageAsRead({ auth, response }: HttpContextContract, message: UserMessages) {
    const authUser = await auth.use('web').user
    if (!authUser) {
      return response.status(404).json({ error: 'Auth user not found!' })
    }
    await UserMessageRead.create({
      readAt: DateTime.now(),
      userMessageId: message.id,
      userId: authUser.id,
    })
    return response.json({ readBy: authUser })
  }
}
