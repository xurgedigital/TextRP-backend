import { DateTime } from 'luxon'
import {
  afterCreate,
  BaseModel,
  beforeSave,
  column,
  HasMany,
  hasMany,
  hasOne,
  HasOne,
} from '@ioc:Adonis/Lucid/Orm'
import UserCredit from 'App/Models/UserCredit'
import Discount from 'App/Models/Discount'
import UserSubscription from 'App/Models/UserSubscription'
import Identifiers from './Identifiers'
import PlatformSetting from './PlatformSetting'
import Hash from '@ioc:Adonis/Core/Hash'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public address: string

  @column()
  public name: string

  @column()
  public textRpUsername: string

  @column()
  public about: string

  @column()
  public rememberMeToken: string | null

  @column()
  public email: string | null

  @column({ serializeAs: null })
  public password: string

  @column()
  public isActive: boolean

  @column({ serializeAs: null })
  public access_token: string | null

  @column()
  public profile_picture: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasOne(() => UserCredit, {})
  public credit: HasOne<typeof UserCredit>

  @hasOne(() => Discount, {
    localKey: 'address',
    foreignKey: 'address',
  })
  public discount: HasOne<typeof Discount>

  @hasOne(() => Identifiers, {
    localKey: 'id',
    foreignKey: 'userId',
  })
  public identifiers: HasOne<typeof Identifiers>

  @hasMany(() => UserSubscription, {})
  public subscriptions: HasMany<typeof UserSubscription>

  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password)
    }
  }

  @afterCreate()
  public static async addBonus(user: User) {
    try {
      const bonus = await PlatformSetting.query()
        .where('key', 'bonus')
        .orWhere('key', 'bonusActive')
      let obj = {}
      bonus.map((element) => {
        obj[element.key] = element.value
      })
      if (obj['bonusActive']) {
        await UserCredit.create({
          userId: user.id,
          balance: Number(obj['bonus']),
        })
      }
    } catch (error) {}
  }
}
