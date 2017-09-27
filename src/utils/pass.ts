import * as crypto from 'crypto'
import { promisify } from 'bluebird'

const pbkdf2 = promisify(crypto.pbkdf2)

export function getRandomString() {
  return crypto
    .randomBytes(128)
    .toString('base64')
}

export async function getPasswordHash(
  password: string,
  iterations: number,
  salt?: string
) {
  if (!salt) {
    salt = getRandomString()
  }
  const hashBuffer = await pbkdf2(password, salt, iterations, 512, 'sha512')
  const hash = hashBuffer.toString('hex')
  return { salt, iterations, hash }
}

export interface IValidatePasswordParams {
  password: string
  iterations: number
  hash: string
  salt: string
}

export async function validatePassword(params: IValidatePasswordParams) {
  const { password, iterations, hash, salt } = params
  const { hash: potentialHash } = await getPasswordHash(password, iterations, salt)
  return potentialHash === hash
}
