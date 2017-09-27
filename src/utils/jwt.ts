import * as jwt from 'jsonwebtoken'
import { promisify } from 'bluebird'
import { getAppConfig } from '../utils/config'

const config = getAppConfig()

const sign = promisify(jwt.sign)
const verify = promisify(jwt.verify)

export async function getJWT(params: Object) {
  const token = await sign(params, config.secret)
  return token as string
}

export async function verifyJWT(token: string): Promise<Object | null> {
  try {
    const decoded = await verify(token, config.secret)
    return decoded
  } catch (e) {
    return null
  }
}
