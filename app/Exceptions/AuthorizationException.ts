import BaseException from './BaseException'

export default class AuthorizationException extends BaseException {
  constructor(message: string, code = 'E_UNAUTHORIZED_ACCESS') {
    super(message, 401, code)
  }
}
