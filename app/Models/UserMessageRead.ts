import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import UserMessages from './UserMessages'

export default class UserMessagesReads extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public userId: number

  @column()
  public userMessageId: number

  @column.dateTime({})
  public readAt: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => User, {
    localKey: 'userId',
    foreignKey: 'id',
  })
  public user: BelongsTo<typeof User>

  @belongsTo(() => UserMessages, {
    localKey: 'userMessageId',
    foreignKey: 'id',
  })
  public userMessages: BelongsTo<typeof UserMessages>
}
