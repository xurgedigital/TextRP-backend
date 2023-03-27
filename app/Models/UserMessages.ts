import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import Conversations from './Conversations'
import { MessageTypeEnum } from 'App/Controllers/Http/User/TwilioController'
import User from './User'

export default class UserMessages extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public conversationId: number

  @column()
  public messageType: MessageTypeEnum

  @column()
  public messageUuid: string

  @column()
  public content: string

  @column()
  public senderId: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Conversations, {
    foreignKey: 'id',
    localKey: 'conversationId',
  })
  public conversations: BelongsTo<typeof Conversations>

  @belongsTo(() => User, {
    foreignKey: 'id',
    localKey: 'senderId',
  })
  public user: BelongsTo<typeof User>
}
