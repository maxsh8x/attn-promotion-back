import { Service } from 'typedi'
import {
  Get,
  Post,
  JsonController,
  Body,
  Authorized,
  NotFoundError,
  BadRequestError,
  HttpCode
} from 'routing-controllers'
import { UserRepository } from '../repository/UserRepository'
import { TokenRepository } from '../repository/TokenRepository'
import { ROLES_ARRAY, ROLES_TYPE } from '../constants'
import { getPasswordHash, validatePassword } from '../utils/pass'
import { getJWT } from '../utils/jwt'
import {
  MinLength,
  MaxLength,
  IsEmail,
  IsIn,
  IsAlphanumeric,
  IsString,
  IsPositive
} from 'class-validator'

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

  @IsString()
  name: string
}

export class BindClientParams {
  @IsPositive()
  user: number

  @IsPositive({ each: true })
  clients: number[]

  @IsIn(['bind', 'unbind'])
  action: 'bind' | 'unbind'
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
  @HttpCode(204)
  @Authorized(['root'])
  @Post('/v1/user')
  async createUser( @Body() params: CreateUserParams) {
    const { username, name, email, role, password } = params
    const userFound = await this.userRepository.findByUsername(username)
    if (userFound) {
      throw new BadRequestError('USER_ALREADY_EXISTS')
    }
    const { salt, iterations, hash } = await getPasswordHash(password, 100000)
    const { _id } = await this.userRepository.create({
      username,
      name,
      hash,
      salt,
      iterations,
      email,
      active: true,
      role: role as ROLES_TYPE
    })
    await this.userRepository.initCache(_id, { active: true })
    // TODO: issue
    return ''
  }

  @Authorized(['root', 'buchhalter'])
  @Get('/v1/user')
  async getAll() {
    const data = await this.userRepository.getAll()
    return data
  }

  @HttpCode(204)
  @Authorized(['root'])
  @Post('/v1/user/bind')
  async bindClient(
    @Body() params: BindClientParams
    ) {
    const {
      user,
      clients,
      action
    } = params
    switch (action) {
      case 'bind':
        await this.userRepository.bindClient(user, clients)
        break
      case 'unbind':
        await this.userRepository.unbindClient(user, clients)
    }
    // TODO: issue
    return ''
  }
}
