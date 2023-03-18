import Subscription from 'App/Models/Subscription'
import Credit from 'App/Models/Credit'
import { DateTime } from 'luxon'
import { BaseModel, HasOne, column } from '@ioc:Adonis/Lucid/Orm'
import { PaymentTypeEnum } from 'App/Controllers/Http/User/PaymentController'

export default class Payment extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({})
  public userId: number

  @column({})
  public paymenttableId: number

  @column({})
  public paymenttableType: PaymentTypeEnum

  public credit: HasOne<typeof Credit>

  public subscription: HasOne<typeof Subscription>

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
