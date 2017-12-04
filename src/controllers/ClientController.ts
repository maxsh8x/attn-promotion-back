import { Service } from 'typedi'
import {
  Get,
  Post,
  Body,
  JsonController,
  QueryParams,
  Authorized,
  OnUndefined,
  BadRequestError,
  CurrentUser,
  Patch,
  Param
} from 'routing-controllers'
import {
  IsString,
  IsNumberString,
  Length,
  Min,
  IsISO8601,
  IsPositive,
  IsOptional,
  IsIn,
  ValidateIf
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
  @IsIn(['all', 'group', 'individual'])
  type: 'all' | 'group' | 'individual'

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

  @IsOptional()
  targetClickCost: number

  @IsISO8601()
  startDate: string

  @IsISO8601()
  endDate: string
}

export class UpdateCampaign {
  @ValidateIf(o => typeof (o.costPerClick) !== 'undefined')
  @IsPositive()
  costPerClick: number

  @ValidateIf(o => typeof (o.targetClickCost) !== 'undefined')
  @IsPositive()
  targetClickCost: number
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
    const { startDate, endDate, user, limit, offset, type } = params
    let clients: number[] = []
    if (type !== 'all') {
      const clientWithQuestions = await this.pageRepository.getClients(type)
      clients.push(...clientWithQuestions)
    }
    if (role === 'manager') {
      const userData = await this.userRepository.getOne(userID)
      if (type !== 'all') {
        clients = clients.filter(n => userData.clients.includes(n))
      } else {
        clients.push(...userData.clients)
      }
    }
    if (user && role !== 'manager') {
      const userData = await this.userRepository.getOne(parseInt(user, 10))
      if (userData.clients.length === 0) {
        return {
          clientsData: [],
          views: {},
          cost: {},
          total: 0
        }
      } else {
        clients.push(...userData.clients)
      }
    }

    const [clientsData, total]: [any, number] = await this.clientRepository.getAll({
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      clients,
      role
    })

    const totalData = await this.pageRepository.getClientsTotal(
      {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        clients: clientsData.map((client: any) => client._id),
        type
      }
    )
    const viewsDataMap: any = {}
    const costMap: any = {}
    for (let i = 0; i < totalData.length; i += 1) {
      viewsDataMap[totalData[i]._id] = totalData[i].views
      costMap[totalData[i]._id] = totalData[i].cost
    }
    for (let i = 0; i < clientsData.length; i += 1) {
      clientsData[i].views = viewsDataMap[clientsData[i]._id] || 0
      clientsData[i].cost = costMap[clientsData[i]._id] || 0
    }
    return {
      cost: costMap,
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

  @OnUndefined(204)
  @Authorized(['root'])
  @Patch('/v1/client/:clientID/page/:pageID')
  async updateCampaign(
    @Param('clientID') clientID: number,
    @Param('pageID') pageID: number,
    @Body() params: UpdateCampaign
    ) {
    const allowedFields = ['costPerClick', 'targetClickCost']
    for (let param in params) {
      if (allowedFields.indexOf(param) === -1) {
        throw new BadRequestError('INVALID_FIELD')
      }
    }
    if (Object.keys(params).length > 0) {
      await this.pageRepository.updateCampaign(clientID, pageID, params)
    }
  }

  @Authorized(['root', 'buchhalter', 'manager'])
  @Get('/v1/client/pages/:clientID')
  async getClientPages(
    @Param('clientID') clientID: number
    ) {
    const data = await this.pageRepository.getClientsPages(clientID)
    return data
  }

  @Authorized(['root', 'buchhalter', 'manager'])
  @Get('/v1/client/search')
  async searchClients(
    @QueryParams() params: SearchClientsParams,
    @CurrentUser({ required: true }) user: any
    ) {
    const { userID, role } = user
    const clients: any[] = []
    if (role === 'manager') {
      const userData = await this.userRepository.getOne(userID)
      clients.push(...userData.clients)
    }
    const { filter } = params
    const limit = 5
    const data = await this.clientRepository.searchFulltext({
      filter,
      limit,
      clients,
      role
    })
    const headLimit = limit - data.length
    if (headLimit > 0) {
      const exclude = data.map((item: any) => item._id)
      const dataPattern = await this.clientRepository.searchPattern({
        limit: headLimit,
        exclude,
        filter,
        clients,
        role
      })
      data.unshift(...dataPattern)
    }
    const result = data.map((item: any) => ({
      value: item._id,
      text: [item.name, item.brand].join(' - ')
    }))
    return result
  }

  @OnUndefined(204)
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
  }

  @OnUndefined(204)
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
      targetClickCost,
      startDate,
      endDate
    } = params
    await this.clientRepository.create({
      page,
      client,
      minViews,
      maxViews,
      targetClickCost,
      startDate,
      endDate
    })
  }

  @OnUndefined(204)
  @Authorized(['root'])
  @Patch('/v1/client/:clientID')
  async updateUser(
    @Param('clientID') clientID: number,
    @Body() params: any
    ) {
    const allowedFields = ['name', 'brand', 'vatin', 'counterID']
    for (let param in params) {
      if (allowedFields.indexOf(param) === -1) {
        throw new BadRequestError('INVALID_FIELD')
      }
    }
    await this.clientRepository.updateByID(clientID, params)
  }
}
