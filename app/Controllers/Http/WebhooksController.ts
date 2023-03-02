import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class WebhooksController {
  public async handle(ctx: HttpContextContract) {
    return ctx
  }
}
