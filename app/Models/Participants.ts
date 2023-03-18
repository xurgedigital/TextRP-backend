import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column, hasOne, HasOne } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import Identifiers from './Identifiers'
import Conversations from './Conversations'

export default class Participants extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public identifierId: number

  @column()
  public creatorId: string

  @column()
  public conversationId: number

  @column()
  public phoneNumber: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => User, {
    foreignKey: 'id',
    localKey: 'creatorId',
  })
  public User: BelongsTo<typeof User>

  @hasOne(() => Identifiers, {
    localKey: 'identifierId',
    foreignKey: 'id',
  })
  public identifiers: HasOne<typeof Identifiers>

  @hasOne(() => Conversations, {
    localKey: 'conversationId',
    foreignKey: 'id',
  })
  public conversations: HasOne<typeof Conversations>
}
