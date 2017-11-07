import { Service } from 'typedi'
import {
  Get,
  Post,
  Body,
  JsonController,
  QueryParams,
  Authorized,
  HttpCode,
  BadRequestError,
  CurrentUser
} from 'routing-controllers'
import {
  IsString,
  IsNumberString,
  Length,
  Min,
  IsISO8601,
  IsPositive,
  IsOptional
} from 'class-validator'
import { ClientRepository } from '../repository/ClientRepository'
import { PageRepository } from '../repository/PageRepository'
import { MetricsRepository } from '../repository/MetricsRepository'
import { UserRepository } from '../repository/UserRepository'

export class PaginationParams {
  @IsNumberString()
  limit: string

  @IsNumberString()
  offset: string
}

export class GetClientsParams extends PaginationParams {
  @IsString()
  filter: string

  @IsISO8601()
  startDate: string

  @IsISO8601()
  endDate: string

  @IsOptional()
  user: string
}

export class GetPageClientsParams {
  // https://github.com/pleerock/class-validator/pull/118
  @IsOptional()
  limit: string

  @IsOptional()
  offset: string

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

  @IsOptional()
  @IsString()
  brand: string

  @IsOptional()
  @Length(12, 12)
  @IsNumberString()
  vatin: string

  @Min(10000000)
  counterID: number
}

export class BindPageParams {
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
    private pageRepository: PageRepository,
    private metricsRepository: MetricsRepository,
    private userRepository: UserRepository
  ) { }

  @Authorized(['root', 'buchhalter', 'manager'])
  @Get('/v1/client/')
  async getClients(
    @QueryParams() params: GetClientsParams,
    @CurrentUser({ required: true }) userData: any
    ) {
    const { userID, role } = userData
    const { filter, startDate, endDate, user, limit, offset } = params
    const clients: number[] = []
    if (role === 'manager') {
      const userData = await this.userRepository.getOne(userID)
      clients.push(...userData.clients)
    }
    if (user && role !== 'manager') {
      const userData = await this.userRepository.getOne(parseInt(user, 10))
      if (userData.clients.length === 0) {
        return {
          clientsData: [],
          views: {},
          costPerClick: {},
          total: 0
        }
      } else {
        clients.push(...userData.clients)
      }
    }
    const [clientsData, total]: [any, number] = await this.clientRepository.getAll({
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      filter,
      clients,
      role
    })
    const totalData = await this.pageRepository.getClientsTotal(
      new Date(startDate),
      new Date(endDate),
      clientsData.map((client: any) => client._id)
    )
    const viewsDataMap: any = {}
    const costPerClickDataMap: any = {}
    for (let i = 0; i < totalData.length; i += 1) {
      viewsDataMap[totalData[i]._id] = totalData[i].views
      costPerClickDataMap[totalData[i]._id] = totalData[i].costPerClick
    }
    for (let i = 0; i < clientsData.length; i += 1) {
      clientsData[i].views = viewsDataMap[clientsData[i]._id]
      clientsData[i].costPerClick = costPerClickDataMap[clientsData[i]._id]
    }
    return {
      costPerClick: costPerClickDataMap,
      views: viewsDataMap,
      clientsData,
      total
    }
  }

  @Authorized(['root', 'buchhalter', 'manager'])
  @Get('/v1/client/page')
  async getPageClients(
    @QueryParams() params: GetPageClientsParams,
    @CurrentUser({ required: true }) user: any
    ) {
    const { userID, role } = user
    const { pageID, limit, offset } = params
    const clients: any[] = []
    if (role === 'manager') {
      const userData = await this.userRepository.getOne(userID)
      clients.push(...userData.clients)
    }
    const clientsData = await this.pageRepository.getPageClientsData({
      clientsLimit: parseInt(limit, 10),
      clientsOffset: parseInt(offset, 10),
      pageID: parseInt(pageID, 10),
      clients,
      role
    })
    const total = clientsData.length > 0 ? clientsData[0].total : 0
    return { clientsData, total }
  }

  @Authorized(['root', 'buchhalter'])
  @Get('/v1/client/search')
  async searchClients(
    @QueryParams() params: SearchClientsParams
    ) {
    const { filter } = params
    const limit = 5
    const data = await this.clientRepository.searchFulltext(filter, limit)
    const headLimit = limit - data.length
    if (headLimit > 0) {
      const exclude = data.map((item: any) => item._id)
      const dataPattern = await this.clientRepository.searchPattern(filter, headLimit, exclude)
      data.unshift(...dataPattern)
    }
    const result = data.map((item: any) => ({
      value: item._id,
      text: [item.name, item.brand].join(' - ')
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
    const isValidCID = await this.metricsRepository.isValidCounterID(counterID)
    if (!isValidCID) {
      throw new BadRequestError('INVALID_COUNTER_ID')
    }
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
  async bindPage(
    @Body() params: BindPageParams
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
