import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class NftFeatureMap extends BaseModel {
  public static table = 'nft_feature_mapping'

  @column({ isPrimary: true })
  public id: number

  @column({})
  public nft_id: number

  @column({})
  public feature_id: number
}
