import Ws from 'App/Services/Ws'
import SocketAuth from 'App/Middleware/SocketAuth'
import SocketController from 'App/Controllers/Http/User/SocketController'

Ws.boot()

/**
 * Listen for incoming socket connections
 */
Ws.io
  .use((socket, next) => {
    if (socket.handshake.query && socket.handshake.query.token) {
      const token = socket.handshake?.query?.token
      if (!token || typeof token === 'string') {
        SocketAuth.authenticate(token)
          .then((user) => {
            socket.handshake.auth = user
            next()
          })
          .catch((e) => next(e))
      }
    } else {
      // next(new Error('Authentication error'))
      // keeping no authentication untill demo
      next()
    }
  })
  .on('connection', SocketController.handleSocketEvents)
