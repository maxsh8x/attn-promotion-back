import { Action } from 'routing-controllers'
import * as LRU from 'lru-cache'
import { ROLES_TYPE } from '../constants'
import { verifyJWT } from '../utils/jwt'
import { TokenRepository } from '../repository/TokenRepository'

// TODO: Dependency injection
const tokenRepository = new TokenRepository()

const cache = LRU({
  maxAge: 1000 * 60 * 60
})

export async function authorizationChecker(action: Action, roles: ROLES_TYPE[]) {
  const token = action.request.headers['authorization']
  if (token) {
    // TODO: Token type
    const verifiedData: any = await verifyJWT(token)
    if (verifiedData) {
      const { userID, role: userRole } = verifiedData
      const tokenExist = await tokenRepository.isExists(token, userID)
      if (
        (tokenExist && (
          (!roles.length) ||
          (userRole === 'root') ||
          (roles.find(role => userRole === role))
        ))
      ) {
        cache.set(token, verifiedData)
        return true
      }
    }
  }
  return false
}

export async function currentUserChecker(action: Action) {
  const token = action.request.headers['authorization']
  return cache.get(token)
}
