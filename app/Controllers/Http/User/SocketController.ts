import UserMessages from 'App/Models/UserMessages'
import Conversations from 'App/Models/Conversations'
import { Socket } from 'socket.io'
import User from 'App/Models/User'

interface MessageData {
  conversationId: number
  messageId: number
}

interface UserConversationInterface {
  conversationId: number
  userName: number
}
interface UserMessagesReadInterface {
  conversationId: number
  messageId?: string
  messageIds?: string[]
}

class SocketController {
  public async handleSocketEvents(socket: Socket) {
    socket.on('joinConversation', async (conversationId: string) => {
      const conversation = await Conversations.find(conversationId)
      if (!conversation) {
        return socket.emit('error', {
          eventType: 'messageNotification',
          message: 'Converstion not found',
        })
      }
      socket.join(conversation.platformConverstionId)
      socket.emit('joinedChannel', conversation)
    })

    socket.on('messageNotification', async (messageData: MessageData) => {
      const conversation = await Conversations.find(messageData.conversationId)
      if (!conversation) {
        return socket.emit('error', {
          eventType: 'messageNotification',
          message: 'Converstion not found',
        })
      }
      const userMessage = await UserMessages.find(messageData.messageId)
      const sender = await User.find(userMessage?.senderId)
      socket
        .to(`${conversation.platformConverstionId}`)
        .emit('messageNotification', { sender, userMessage })
    })

    socket.on('userIsTyping', async (userTypingInterface: UserConversationInterface) => {
      const conversation = await Conversations.find(userTypingInterface.conversationId)
      if (!conversation) {
        return socket.emit('error', {
          eventType: 'userIsTyping',
          message: 'Converstion not found',
        })
      }
      socket
        .to(`${conversation.platformConverstionId}`)
        .emit('userIsTyping', { userName: userTypingInterface.userName })
    })

    socket.on('markMessageRead', async (message: UserMessagesReadInterface) => {
      const conversation = await Conversations.find(message.conversationId)
      if (!conversation) {
        return socket.emit('error', {
          eventType: 'userIsTyping',
          message: 'Converstion not found',
        })
      }
      const authUser = await User.find(socket.handshake.auth.id)
      socket
        .to(`${conversation.platformConverstionId}`)
        .emit('markMessageRead', { message, user: authUser })
    })

    socket.on('newUserAddedToConversation', async (userConversation: UserConversationInterface) => {
      const conversation = await Conversations.find(userConversation.conversationId)
      if (!conversation) {
        return socket.emit('error', {
          eventType: 'userIsTyping',
          message: 'Converstion not found',
        })
      }
      socket
        .to(`${conversation.platformConverstionId}`)
        .emit('newUserAddedToConversation', { userName: userConversation.userName })
    })
  }
}

export default new SocketController()
