import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Features extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({})
  public feature: string

  @column({})
  public rules: string

  @column({})
  public description: string
}
