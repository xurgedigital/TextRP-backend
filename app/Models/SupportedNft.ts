import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class SupportedNft extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({})
  public contract_address: string

  @column({})
  public title: string

  @column({})
  public description: string

  @column({})
  public features: string[] | string

  @column({})
  public taxon: string

  @column({})
  public image_link: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  // @beforeSave()
  // public static async updateValues(user: SupportedNft) {
  //   if (user.$dirty.password) {
  //     user.features = JSON.stringify(user.features)
  //   }
  // }
}
