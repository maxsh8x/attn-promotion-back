import { Service } from 'typedi'
import { redisPub } from '../utils/redis'

// Add refresh tokens
@Service()
export class TokenRepository {
  async add(token: string, userID: string) {
    await redisPub.sadd(`TOKENS:${userID}`, token)
  }

  async isExists(token: string, userID: string) {
    const isTokenExists = await redisPub.sismember(`TOKENS:${userID}`, token)
    return Boolean(isTokenExists)
  }
}
