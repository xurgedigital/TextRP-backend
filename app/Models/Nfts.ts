import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Nfts extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({})
  public contract_address: string

  @column({})
  public title: string

  @column({})
  public description: string

  @column({})
  public taxon: string
  @column({})
  public url: string
  @column({})
  public image_link: string
}
