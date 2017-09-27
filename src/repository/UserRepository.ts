import { Service } from 'typedi'
import { User } from '../models/User'
import { ROLES_TYPE } from '../constants'
import { redisPub } from '../utils/redis'

export interface ICreateParams {
  username: string
  hash: string
  salt: string
  iterations: number
  active: boolean
  balance?: number
  email: string
  role: ROLES_TYPE
}

export interface IInitCacheParams {
  balance: number
}

@Service()
export class UserRepository {
  create(params: ICreateParams) {
    return User.create(params)
  }

  findByUsername(username: string): any {
    return User
      .findOne({ username }, '_id hash salt iterations role active')
      .lean()
      .exec()
  }

  initCache(userID: string, params: IInitCacheParams) {
    return redisPub.hmset(`USER:${userID}`, params)
  }

  getCache(userID: string) {
    return redisPub.hmget(`USER:${userID}`)
  }
}
