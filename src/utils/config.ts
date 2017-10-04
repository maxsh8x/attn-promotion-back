import { validate, IsString, IsInt } from 'class-validator'
import { plainToClass } from 'class-transformer'

class Config {
  @IsInt()
  port: number

  @IsString()
  mongoDB: string

  @IsString()
  agendaMongoDB: string

  @IsString()
  redis: string

  @IsString()
  secret: string

  @IsInt()
  counterID: number

  @IsString()
  tokenOAuth: string

  @IsString()
  apiURL: string
}

export function getAppConfig(): Config {
  return require(`../../config.${process.env.NODE_ENV}.json`)
}

export async function validateConfig(): Promise<boolean> {
  const config = getAppConfig()
  const classValidator = plainToClass(Config, config)
  const validationError = await validate(classValidator)
  return !(validationError.length > 0)
}
