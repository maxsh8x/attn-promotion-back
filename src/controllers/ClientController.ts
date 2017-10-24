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
  Max,
  IsISO8601,
  IsPositive
} from 'class-validator'
import { ClientRepository } from '../repository/ClientRepository'
import { PageRepository } from '../repository/PageRepository'

export class GetClientsParams {
  @IsString()
  filter: string
}

export class GetPageClientsParams {
  @IsNumberString()
  pageID: string
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
  counterID: number
}

export class BindClientParams {
  @IsPositive()
  page: number

  @IsPositive()
  client: number

  @IsPositive()
  minViews: number

  @IsPositive()
  maxViews: number

  @IsISO8601()
  startDate: string

  @IsISO8601()
  endDate: string
}

@Service()
@JsonController()
export class ClientController {
  constructor(
    private clientRepository: ClientRepository,
    private pageRepository: PageRepository
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
  @Get('/v1/client/page')
  async getPageClients(
    @QueryParams() params: GetPageClientsParams
    ) {
    const { pageID } = params
    const clients = await this.pageRepository.getPageClients(
      parseInt(pageID, 10)
    )
    const data = await this.clientRepository.getAllByIDs(
      clients
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
    const result = data.map((item: any) => ({
      value: item._id,
      text: item.name
    }))
    return result
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

  @HttpCode(204)
  @Authorized(['root'])
  @Post('/v1/client/bind')
  async bind(
    @Body() params: BindClientParams
    ) {
    const {
      page,
      client,
      minViews,
      maxViews,
      startDate,
      endDate
    } = params
    await this.clientRepository.create({
      page,
      client,
      minViews,
      maxViews,
      startDate,
      endDate
    })
    // TODO: issue
    return ''
  }
}
