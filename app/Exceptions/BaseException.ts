import { Exception } from '@poppinss/utils'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'

export default abstract class BaseException extends Exception {
  constructor(message: string, status: number, public code: string) {
    super(message, status)
  }

  public async handle(error: this, { response }: HttpContextContract): Promise<void> {
    Logger.warn(`Status: ${error.status} Message: ${this.message} Code:${this.code}`)
    response.status(error.status).send({ message: this.message, code: this.code })
  }
}
