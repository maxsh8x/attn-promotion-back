import { Service } from 'typedi'
import {
  Get, Post, Body, JsonController, QueryParams, Authorized, HttpCode
} from 'routing-controllers'
import { IsString, IsNumberString } from 'class-validator'
import { ClientRepository } from '../repository/ClientRepository'

export class GetClientsParams {
  @IsNumberString()
  offset: string

  @IsNumberString()
  limit: string

  @IsString()
  filter: string
}

export class SearchClientsParams {
  @IsString()
  filter: string
}

export class CreateClientParams {
  @IsString()
  name: string
}

@Service()
@JsonController()
export class ClientController {
  constructor(
    private clientRepository: ClientRepository
  ) { }

  @Authorized(['root'])
  @Get('/v1/client/')
  async getClients(
    @QueryParams() params: GetClientsParams
    ) {
    const { offset, limit, filter } = params
    const data = await this.clientRepository.getAll(
      parseInt(offset, 10),
      parseInt(limit, 10),
      filter
    )
    return data
  }

  @Authorized(['root'])
  @Get('/v1/client/search')
  async searchClients(
    @QueryParams() params: SearchClientsParams
    ) {
    const { filter } = params
    const data = await this.clientRepository.search(filter, 5)
    return data
  }

  @HttpCode(204)
  @Authorized(['root'])
  @Post('/v1/client')
  async createClient(
    @Body() params: CreateClientParams
    ) {
    const { name } = params
    await this.clientRepository.create({
      name
    })
    // TODO: issue
    return ''
  }
}
