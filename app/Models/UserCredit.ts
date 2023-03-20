import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, afterCreate, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import User from 'App/Models/User'
import PlatformSetting from './PlatformSetting'

export default class UserCredit extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({})
  public userId: number

  @belongsTo(() => User, {})
  public user: BelongsTo<typeof User>

  @column({})
  public balance: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @afterCreate()
  public static async hashPassword(userCredit: UserCredit) {
    try {
      const bonus = await PlatformSetting.query()
        .where('key', 'bonus')
        .orWhere('key', 'bonusIsActive')
      let obj = {}
      bonus.map((element) => {
        obj[element.key] = element.value
      })
      if (obj['bonusIsActive']) {
        userCredit.balance = Number(obj['bonus'])
      }
    } catch (error) {}
  }
}
