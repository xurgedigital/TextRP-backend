import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Nft_feature_map extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({})
  public nft_id: number

  @column({})
  public feature_id: number
}