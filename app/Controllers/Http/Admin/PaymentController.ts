import Credit from 'App/Models/Credit'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { bind } from '@adonisjs/route-model-binding'
import { schema } from '@ioc:Adonis/Core/Validator'
import Payment from 'App/Models/Payment'
import XummService from 'App/Services/XummService'
import User from 'App/Models/User'

export default class PaymentController {
  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const payment = await Payment.query().paginate(page, limit)
    return response.json(payment)
  }

  public async create({ request, response }: HttpContextContract) {
    const createPaymentSchema = schema.create({
      userId: schema.number(),
      uuid: schema.string(),
      payload: schema.string(),
      errorDetails: schema.string(),
    })

    const payload = await request.validate({ schema: createPaymentSchema })
    const user = await Payment.create(payload)
    return response.json(user)
  }

  @bind()
  public async update({ request, response }: HttpContextContract, payment: Payment) {
    const updatePaymentSchema = schema.create({
      userId: schema.number(),
      uuid: schema.string(),
      payload: schema.string(),
      errorDetails: schema.string(),
    })

    const payload = await request.validate({ schema: updatePaymentSchema })
    payment.merge(payload)
    await payment.save()
    return response.json(Payment)
  }

  @bind()
  public async delete({ response }: HttpContextContract, payment: Payment) {
    await payment.delete()
    return response.status(200)
  }

  public async makePayment({ request, response, auth }: HttpContextContract) {
    const { destination, creditId } = request.body()
    if (!destination || !creditId) {
      return response.status(422).json({ error: 'missing destination, creditId' })
    }
    const creditData = await Credit.find(creditId)
    if (!creditData) {
      return response.status(404).json({ error: 'Credit Data not found' })
    }
    const authUser = await auth.use('web').user
    const user = await User.query()
      .preload('discount')
      .preload('subscriptions')
      .preload('credit')
      .where('id', authUser?.id || 0)
      .first()

    const ping = await XummService.sdk.payload.create({
      txjson: {
        TransactionType: 'Payment',
        Destination: destination,
        Amount: creditData.price,
      },
    })
    const payload = {
      txjson: {
        TransactionType: 'Payment',
        Destination: destination,
        Amount: creditData.price,
      },
    }
    await Payment.firstOrCreate(
      {
        userId: user?.id,
        uuid: ping?.uuid,
        payload: JSON.stringify(payload),
      },
      {}
    )
    return { data: ping }
  }
}
