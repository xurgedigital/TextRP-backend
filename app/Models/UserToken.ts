import { DateTime } from 'luxon'
import { BaseModel, column, BelongsTo, belongsTo, beforeSave } from '@ioc:Adonis/Lucid/Orm'
import Encryption from '@ioc:Adonis/Core/Encryption'
import User from 'App/Models/User'

export default class UserToken extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public uuid: string

  @column()
  public user_address: string

  @belongsTo(() => User, {
    localKey: 'address',
    foreignKey: 'user_address',
  })
  public user: BelongsTo<typeof User>

  @column()
  public token: string

  @column.dateTime({})
  public expiresAt: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async hashPassword(user: UserToken) {
    if (user.$dirty.token) {
      user.token = Encryption.encrypt(user.token)
    }
  }
}
