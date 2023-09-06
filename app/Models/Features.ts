import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Features extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({})
  public feature: string

  @column({})
  public rule: string

  @column({})
  public command: string
}
