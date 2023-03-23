import { DateTime } from 'luxon'
import { BaseModel, column, HasMany, hasMany, hasOne, HasOne } from '@ioc:Adonis/Lucid/Orm'
import Identifiers from './Identifiers'
import Participants from './Participants'

export default class Conversations extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public identifierId: number

  @column()
  public creatorId: number

  @column()
  public platformConverstionId: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasOne(() => Identifiers, {
    localKey: 'identifierId',
    foreignKey: 'id',
  })
  public identifiers: HasOne<typeof Identifiers>

  @hasMany(() => Participants, {
    localKey: 'id',
    foreignKey: 'conversationId',
  })
  public participants: HasMany<typeof Participants>
}
