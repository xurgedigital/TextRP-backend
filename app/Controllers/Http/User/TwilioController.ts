import NotFoundException from 'App/Exceptions/NotFoundException'
import Logger from '@ioc:Adonis/Core/Logger'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Twilio from 'twilio'
import TwilioConfig from 'Config/twilio'
import User from 'App/Models/User'
import Conversations from 'App/Models/Conversations'
import UserMessages from 'App/Models/UserMessages'
import Identifiers from 'App/Models/Identifiers'
import Participants from 'App/Models/Participants'
import Ws from 'App/Services/Ws'
import UserMessagesReads from 'App/Models/UserMessageRead'
import { DateTime } from 'luxon'
import UnProcessableException from 'App/Exceptions/UnProcessableException'
import AuthorizationException from 'App/Exceptions/AuthorizationException'
import InternalException from 'App/Exceptions/InternalException'

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

export default class TwilioController {
  private client = Twilio(TwilioConfig.TWILIO_ACCOUNT_SID, TwilioConfig.TWILIO_AUTH_TOKEN)

  public async generateToken({ auth, response }: HttpContextContract) {
    const authUser = await auth.use('web').user
    if (!authUser) return response.status(401)
    let AccessToken = Twilio.jwt.AccessToken

    let token = new AccessToken(
      TwilioConfig.TWILIO_ACCOUNT_SID,
      TwilioConfig.TWILIO_API_KEY_SID,
      TwilioConfig.TWILIO_API_KEY_SECRET,
      {
        identity: authUser.address,
        ttl: 3600,
      }
    )

    let grant = new AccessToken.ChatGrant({ serviceSid: TwilioConfig.TWILIO_CHAT_SERVICE_SID })
    if (TwilioConfig.TWILIO_PUSH_CREDENTIAL_SID) {
      // Optional: without it, no push notifications will be sent
      grant.pushCredentialSid = TwilioConfig.TWILIO_PUSH_CREDENTIAL_SID
    }
    token.addGrant(grant)
    return response.json({
      jwt: token.toJwt(),
    })
  }

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

  public async sendMessage({ auth, request, response, params }: HttpContextContract) {
    const authUser = await auth.use('web').user
    if (!authUser) {
      throw new AuthorizationException('Unauthorized Access!')
    }
    if (!params.conversation) {
      throw new UnProcessableException('Please provide conversation in params!')
    }
    const conversation = await Conversations.find(params.conversation)
    if (!conversation) {
      throw new NotFoundException('Conversation Not found!')
    }
    const { message } = request.body()
    if (!message) {
      throw new UnProcessableException('Please send a message in the body!')
    }
    await authUser.load('identifiers')
    if (!authUser.identifiers) {
      throw new UnProcessableException('Loggedin user dosent have an identifier!')
    }
    await conversation.load('participants', (participants) => {
      participants.where('identifierId', authUser.identifiers.id)
    })

    if (!conversation.participants || !conversation.participants.length) {
      throw new UnProcessableException('Loggedin user is not in this conversation!')
    }
    const messageResponse = await this.client.conversations.v1
      .conversations(conversation.platformConverstionId)
      .messages.create({ author: authUser.name, body: message })
      .catch((error) => {
        Logger.error(error)
        throw new UnProcessableException('An error occoured from twilio while creating messages!')
      })
    const userMessage = await UserMessages.create({
      conversationId: conversation.id,
      messageUuid: messageResponse.sid,
      messageType: MessageTypeEnum.TEXT,
      content: message,
      senderId: authUser.id,
    })
    Ws.io
      .to(`${conversation.platformConverstionId}`)
      .emit('messageNotification', { sender: authUser, userMessage })
    return response.json(messageResponse)
  }

  public async getAllMessagesFromConversation({ response, params }: HttpContextContract) {
    try {
      if (!params.conversation) {
        throw new UnProcessableException('Please provide conversation in params!')
      }
      const conversation = await Conversations.find(params.conversation)
      if (!conversation) {
        throw new NotFoundException('Conversation Not found!')
      }
      const messageResponse = await this.client.conversations.v1
        .conversations(conversation.platformConverstionId)
        .messages.list({ limit: 20 })

      return response.json(messageResponse)
    } catch (error) {
      throw new UnProcessableException('An error occoured from twilio while fetching messages!')
    }
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
      throw new AuthorizationException('Unauthorized Access!')
    }
    const { conversationName } = request.body()
    if (!conversationName) {
      throw new UnProcessableException('Please provide a name to your conversation!')
    }
    const authUserIdentifier = await this.fetchOrCreateUserIdentifier(authUser)

    const conversationResponse = await this.client.conversations.v1.conversations
      .create({
        friendlyName: conversationName,
      })
      .catch((error) => {
        Logger.error(error)
        throw new UnProcessableException(
          'An error occoured from twilio while creating conversation!'
        )
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
    return response.json({ conversationParticipant, conversation })
  }

  public async startConversation({ request, response, params }: HttpContextContract) {
    if (!params.conversation) {
      throw new UnProcessableException('Please provide conversation in params!')
    }
    const conversations = await Conversations.find(params.conversation)
    if (!conversations) {
      throw new NotFoundException('Conversation Not found!')
    }
    const { walletAddress } = request.body()
    if (!walletAddress) {
      throw new NotFoundException('Reciver wallet address not found!')
    }
    const receiverUser = await User.query().where('address', walletAddress).first()
    if (!receiverUser) {
      throw new NotFoundException('Reciver not found!')
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
    try {
      const conversationUser = await this.client.conversations.v1.users.create({
        identity: user.address,
      })
      if (!conversationUser.sid) {
        throw 'sid not returned from twilio'
      }
      return await Identifiers.create({
        uuid: conversationUser.sid,
        address: user.address,
        serviceName: ServiceNameEnum.TWILIO,
        userId: user.id,
      })
    } catch (error) {
      Logger.error(error)
      throw new UnProcessableException('An error occoured from twilio while creating user!')
    }
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
      Logger.info(error)
      throw new UnProcessableException(
        'An error occoured from twilio while adding participant to conversation!'
      )
    }
  }

  public async markMessageAsRead({ auth, response, params }: HttpContextContract) {
    try {
      const authUser = await auth.use('web').user
      if (!authUser) {
        throw new AuthorizationException('Unauthorized Access!')
      }
      if (!params.message) {
        throw new UnProcessableException('Please provide messageId in params!')
      }
      const message = await UserMessages.find(params.message)
      if (!message) {
        throw new NotFoundException('User Message Not found!')
      }
      const userMessagesReads = await UserMessagesReads.query()
        .where('userMessageId', message.id)
        .andWhere('userId', authUser.id)
      if (userMessagesReads.length > 0) {
        throw new UnProcessableException('User has already read the message!')
      }
      const readtMeta = await UserMessagesReads.create({
        readAt: DateTime.now(),
        userMessageId: message.id,
        userId: authUser.id,
      })
      return response.json({ readtMeta, readBy: authUser })
    } catch (error) {
      Logger.info(error)
      throw new InternalException('Something went wrong')
    }
  }
}
