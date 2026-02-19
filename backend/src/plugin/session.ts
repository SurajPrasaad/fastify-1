import fp from 'fastify-plugin'
import cookie from '@fastify/cookie'
import session from '@fastify/session'
import RedisStore from 'connect-redis'
import { redis } from '../config/redis.js'

export default fp(async (fastify) => {
  fastify.register(cookie)

  const redisStore = new RedisStore({
    client: redis,
    prefix: "fastify-session:",
  })

  fastify.register(session, {
    store: redisStore as any,
    secret: process.env.SESSION_SECRET || 'dtlgoAO6/uOqCnNX0HFMl28EtJXLPcvmTbKCMQbHfFA=',
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
  })
})
