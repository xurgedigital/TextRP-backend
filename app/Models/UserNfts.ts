import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class UserNfts extends BaseModel {
  @column()
  public user_address: string

  @column()
  public uuid: string

  @column()
  public token: string
}
