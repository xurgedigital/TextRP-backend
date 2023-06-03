import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class UserExternalId extends BaseModel {
  public static connection = 'synapse'
  public static table = 'user_external_ids'

  @column()
  public authProvider: string

  @column()
  public externalId: string

  @column()
  public userId: string
}
