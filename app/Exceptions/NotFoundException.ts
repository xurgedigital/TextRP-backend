import BaseException from './BaseException'

export default class NotFoundException extends BaseException {
  constructor(message: string, code = 'E_NOT_FOUND') {
    super(message, 404, code)
  }
}
