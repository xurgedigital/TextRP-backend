import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Identifiers from './Identifiers'
import Conversations from './Conversations'

export default class Participants extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public identifierId: number

  @column()
  public conversationId: number

  @column()
  public uuid: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Identifiers, {
    localKey: 'identifierId',
    foreignKey: 'participantsId',
  })
  public identifiers: BelongsTo<typeof Identifiers>

  @belongsTo(() => Conversations, {
    localKey: 'conversationId',
    foreignKey: 'id',
  })
  public conversations: BelongsTo<typeof Conversations>
}
