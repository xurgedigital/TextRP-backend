import Credit from 'App/Models/Credit'
import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm'

export default class Payment extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({})
  public userId: number

  @column({})
  public paymenttableId: number

  @column({})
  public paymenttableType: string

  public credit: BelongsTo<typeof Credit>

  @column()
  public uuid: string

  @column({})
  public payload: string

  @column({})
  public errorDetails: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
