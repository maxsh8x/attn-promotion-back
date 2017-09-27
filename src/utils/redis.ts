import * as Redis from 'ioredis'
import { getAppConfig } from '../utils/config'

const config = getAppConfig()

export const redisPub = new Redis(config.redis)
export const redisSub = new Redis(config.redis)
