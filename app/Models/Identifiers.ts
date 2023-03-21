import Participants from 'App/Models/Participants'
import { ServiceNameEnum } from './../Controllers/Http/User/TwilioController'
import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, HasMany, belongsTo, column, hasMany } from '@ioc:Adonis/Lucid/Orm'
import User from './User'

export default class Identifiers extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public serviceName: ServiceNameEnum

  @column()
  public uuid: string

  @column()
  public address: string

  @column()
  public userId: number

  @column()
  public participantsId: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasMany(() => Participants, {
    localKey: 'participantsId',
    foreignKey: 'id',
  })
  public participants: HasMany<typeof Participants>

  @belongsTo(() => User, {
    localKey: 'userId',
    foreignKey: 'id',
  })
  public user: BelongsTo<typeof User>
}
