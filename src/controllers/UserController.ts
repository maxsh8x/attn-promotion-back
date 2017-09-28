import { Service } from 'typedi'
import {
  Post, JsonController, Body, Authorized, NotFoundError,
  BadRequestError, HttpCode
} from 'routing-controllers'
import { UserRepository } from '../repository/UserRepository'
import { TokenRepository } from '../repository/TokenRepository'
import { ROLES_ARRAY, ROLES_TYPE } from '../constants'
import { getPasswordHash, validatePassword } from '../utils/pass'
import { getJWT } from '../utils/jwt'
import { MinLength, MaxLength, IsEmail, IsIn, IsAlphanumeric } from 'class-validator'

export class LoginParams {
  @IsAlphanumeric()
  @MinLength(5)
  @MaxLength(15)
  username: string

  @MinLength(5)
  @MaxLength(15)
  password: string
}

export class CreateUserParams extends LoginParams {
  @IsEmail()
  email: string

  @IsIn(ROLES_ARRAY)
  role: ROLES_TYPE
}

@Service()
@JsonController()
export class UserController {
  constructor(
    private userRepository: UserRepository,
    private tokenRepository: TokenRepository
  ) { }
  @Post('/v1/login')
  async login( @Body() params: LoginParams) {
    const { username, password } = params
    const userData = await this.userRepository.findByUsername(username)
    if (!userData) {
      throw new NotFoundError('USER_NOT_FOUND')
    }

    if (!userData.active) {
      throw new BadRequestError('USER_NOT_ACTIVATED')
    }

    const isValidPassword = await validatePassword({
      ...userData,
      password
    })
    if (!isValidPassword) {
      throw new NotFoundError('USER_NOT_FOUND')
    }
    const { role, _id: userID } = userData
    const token = await getJWT({
      username,
      userID,
      role
    })
    await this.tokenRepository.add(token, userID)
    return { token, username, role, userID }
  }

  // TODO: zxcvbn
  // @Authorized(['root'])
  @Post('/v1/user')
  async createUser( @Body() params: CreateUserParams) {
    const { username, email, role, password } = params
    const userFound = await this.userRepository.findByUsername(username)
    if (userFound) {
      throw new BadRequestError('USER_ALREADY_EXISTS')
    }
    const { salt, iterations, hash } = await getPasswordHash(password, 100000)
    const { _id, balance } = await this.userRepository.create({
      username,
      hash,
      salt,
      iterations,
      email,
      active: true,
      role: role as ROLES_TYPE
    })
    await this.userRepository.initCache(_id, { balance })
    return 'ok'
  }
}
