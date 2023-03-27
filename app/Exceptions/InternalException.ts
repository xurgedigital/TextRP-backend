import BaseException from './BaseException'

export default class InternalException extends BaseException {
  constructor(message: string, code = 'E_INTERNAL_ERROR') {
    super(message, 500, code)
  }
}
