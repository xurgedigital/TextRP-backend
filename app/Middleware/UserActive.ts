import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class UserActive {
  public async handle({ auth }: HttpContextContract, next: () => Promise<void>) {
    await auth.use('web').authenticate()
    const user = await auth.use('web').user
    if (!user?.isActive) {
      throw 'User is inactive'
    }
    await next()
  }
}
