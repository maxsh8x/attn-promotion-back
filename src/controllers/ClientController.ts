import { Service } from 'typedi'
import {
  Get,
  Post,
  Body,
  JsonController,
  QueryParams,
  Authorized,
  HttpCode
} from 'routing-controllers'
import {
  IsString,
  IsNumberString,
  Length,
  Min,
  Max
} from 'class-validator'
import { ClientRepository } from '../repository/ClientRepository'

export class GetClientsParams {
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

  @IsString()
  brand: string

  @Length(12, 12)
  @IsNumberString()
  vatin: string

  @Min(10000000)
  @Max(99999999)
  counterID: string
}

@Service()
@JsonController()
export class ClientController {
  constructor(
    private clientRepository: ClientRepository
  ) { }

  @Authorized(['root', 'buchhalter'])
  @Get('/v1/client/')
  async getClients(
    @QueryParams() params: GetClientsParams
    ) {
    const { filter } = params
    const data = await this.clientRepository.getAll(
      filter
    )
    return data
  }

  @Authorized(['root', 'buchhalter'])
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
    const { name, brand, vatin, counterID } = params
    await this.clientRepository.create({
      name,
      brand,
      vatin,
      counterID
    })
    // TODO: issue
    return ''
  }
}
