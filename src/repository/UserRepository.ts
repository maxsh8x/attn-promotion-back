import { Service } from 'typedi'
import { User } from '../models/User'
import { ROLES_TYPE } from '../constants'
import { redisPub } from '../utils/redis'

export interface ICreateParams {
  username: string
  name: string
  hash: string
  salt: string
  iterations: number
  active: boolean
  email: string
  role: ROLES_TYPE
}

export interface IInitCacheParams {
  active: boolean
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

  getOne(userID: number): any {
    return User
      .findById(userID)
      .lean()
      .exec()
  }

  initCache(userID: string, params: IInitCacheParams) {
    return redisPub.hmset(`USER:${userID}`, params)
  }

  getCache(userID: string) {
    return redisPub.hmget(`USER:${userID}`)
  }

  getAll() {
    return User
      .find({}, 'username name role email')
      .lean()
      .exec()
  }

  bindClient(userID: number, clients: number[]) {
    return User
      .findOneAndUpdate({
        _id: userID
      }, {
        $addToSet: { clients: { $each: clients } }
      })
      .lean()
      .exec()
  }

  unbindClient(userID: number, clients: number[]) {
    return User
      .findOneAndUpdate({
        _id: userID
      }, {
        $pull: { clients: { $in: clients } }
      })
      .lean()
      .exec()
  }
}
