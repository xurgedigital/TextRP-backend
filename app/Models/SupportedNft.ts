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

  @column({ serialize: (v) => JSON.parse(v), prepare: (v) => JSON.stringify(v) })
  public features: string[]

  @column({})
  public taxon: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
