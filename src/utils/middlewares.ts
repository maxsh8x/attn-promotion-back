import { Action } from 'routing-controllers'
import { ROLES_TYPE } from '../constants'
import { verifyJWT } from '../utils/jwt'
import { TokenRepository } from '../repository/TokenRepository'

// TODO: Dependency injection
const tokenRepository = new TokenRepository()

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
        action.context.user = verifiedData
        return true
      }
    }
  }
  return false
}

export async function currentUserChecker(action: Action) {
  return action.context.user
}
