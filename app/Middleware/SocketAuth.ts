import User from 'App/Models/User'
import UserToken from 'App/Models/UserToken'

class SocketAuthentication {
  private checkToken = async (token: string): Promise<User> => {
    const apiToken = await UserToken.query()
      .select('userId')
      .andWhere('token', token)
      .preload('user')
      .first()
    if (!apiToken) {
      throw new Error('E_INVALID_API_TOKEN')
    }
    return apiToken.user as User
  }

  public authenticate = async (token: string): Promise<User> => {
    if (!token || typeof token !== 'string') {
      throw new Error('Missing Parameter')
    }
    try {
      const user = await this.checkToken(token)
      return user
    } catch (error) {
      throw new Error('Bad Credentials')
    }
  }
}

export default new SocketAuthentication()
