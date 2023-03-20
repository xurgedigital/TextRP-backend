import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import Conversations from './Conversations'

export default class UserMessages extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public conversationId: number

  @column()
  public messagetype: string

  @column()
  public content: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Conversations, {
    foreignKey: 'id',
    localKey: 'conversationId',
  })
  public User: BelongsTo<typeof Conversations>
}
