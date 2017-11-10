import { Service } from 'typedi'
import {
  Get,
  Post,
  Body,
  JsonController,
  QueryParams,
  QueryParam,
  Authorized,
  Patch,
  Param,
  HttpCode,
  BadRequestError,
  CurrentUser
} from 'routing-controllers'
import {
  IsUrl,
  IsString,
  IsBooleanString,
  IsBoolean,
  IsNumberString,
  IsPositive,
  IsIn,
  Min,
  IsISO8601,
  ValidateIf,
  ArrayUnique,
  IsOptional
} from 'class-validator'

import { PageRepository } from '../repository/PageRepository'
import { MetricsRepository } from '../repository/MetricsRepository'
import { InputRepository } from '../repository/InputRepository'
import { ClientRepository } from '../repository/ClientRepository'
import { UserRepository } from '../repository/UserRepository'
import { getTitle, getStartURLPath } from '../utils/page'
import { totalByPage } from '../utils/metrics'
import {
  sources,
  QUESTION_VARIANT_TYPE,
  QUESTION_VARIANT_ARRAY
} from '../constants'

export class CreateGroupPageParams {
  @IsUrl()
  url: string

  @Min(10000000)
  counterID: number
}

export class BaseCreatorParams {
  @IsPositive()
  minViews: number

  @IsPositive()
  maxViews: number

  @IsPositive()
  costPerClick: number

  @IsISO8601()
  startDate: string

  @IsISO8601()
  endDate: string
}

export class BasePaginationParams {
  @IsNumberString()
  offset: string

  @IsNumberString()
  limit: string
}

export class CreatePageParams extends BaseCreatorParams {
  @IsUrl()
  url: string

  @IsPositive()
  client: number

  @IsIn(['individual', 'related'])
  type: 'individual' | 'related'

  @ValidateIf(o => o.type === 'related')
  @IsPositive()
  parent: number
}

export class GetPageTitleParams {
  @IsUrl()
  url: string
}

export class UpdateStatusParams {
  @IsBoolean()
  active: boolean
}

export class CountParams {
  @IsBooleanString()
  active: string
}

export class GetPagesParams extends BasePaginationParams {
  @IsString()
  yDate: string

  @IsBooleanString()
  active: string

  @IsString()
  filter: string

  @IsString()
  clients: string
}

export class GetClientPagesParams {
  @IsOptional()
  offset: string

  @IsOptional()
  limit: string

  @IsISO8601()
  startDate: string

  @IsISO8601()
  endDate: string

  @IsNumberString()
  clientID: string

  @IsIn(['all', 'group', 'individual'])
  type: 'all' | 'group' | 'individual'
}

export class GetQuestionParams extends BasePaginationParams {
  @IsISO8601()
  startDate: string

  @IsISO8601()
  endDate: string

  @IsIn(QUESTION_VARIANT_ARRAY)
  type: QUESTION_VARIANT_TYPE
}

export class SearchPagesParams {
  @IsString()
  filter: string
}

export class BindClientsParams extends BaseCreatorParams {
  @IsPositive()
  page: number

  @ArrayUnique()
  @IsPositive({
    each: true
  })
  clients: number[]
}

@Service()
@JsonController()
export class PageController {
  constructor(
    private pageRepository: PageRepository,
    private metricsRepository: MetricsRepository,
    private inputRepository: InputRepository,
    private clientRepository: ClientRepository,
    private userRepository: UserRepository
  ) { }

  @HttpCode(204)
  @Authorized(['root'])
  @Post('/v1/page/group')
  async createGroupPage(
    @Body() params: CreateGroupPageParams
    ) {
    const { url: rawURL, counterID } = params
    const url = getStartURLPath(rawURL)
    const title = await getTitle(rawURL)
    const isValidCID = await this.metricsRepository.isValidCounterID(counterID)
    if (!isValidCID) {
      throw new BadRequestError('INVALID_COUNTER_ID')
    }
    await this.pageRepository.create(
      {
        url,
        title,
        counterID,
        type: 'group'
      }
    )
    return ''
  }

  @Authorized(['root'])
  @Post('/v1/page')
  async createPage(
    @Body() params: CreatePageParams
    ) {
    const {
      url: rawURL,
      client,
      type,
      parent,
      minViews,
      maxViews,
      costPerClick,
      startDate,
      endDate
    } = params
    const url = getStartURLPath(rawURL)
    const title = await getTitle(rawURL)
    const pageData = await this.pageRepository.create({
      url,
      title,
      parent,
      type,
      meta: [{
        client,
        minViews,
        maxViews,
        costPerClick,
        startDate,
        endDate
      }]
    })
    const { _id: pageID } = pageData
    await this.metricsRepository.updateMetrics(pageID, startDate, endDate)
    return { pageID }
  }

  @Authorized(['root', 'buchhalter'])
  @Get('/v1/page/title')
  async getTitle(
    @QueryParams() params: GetPageTitleParams
    ) {
    const title = await getTitle(params.url)
    return { title }
  }

  @Authorized(['root', 'buchhalter'])
  @Get('/v1/page/')
  async getPages(
    @QueryParams() params: GetPagesParams
    ) {
    const { yDate, limit, offset, filter, active, clients: rawClients } = params
    // TODO: class-validator
    const clients = rawClients
      .split(',')
      .filter(x => parseInt(x, 10))
      .map(x => parseInt(x, 10))
    const isActive = (active === 'true')
    const [pages, activePages, inactivePages] = await this.pageRepository.getAll({
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      active: isActive,
      filter,
      clients
    })
    const input = await this.inputRepository.getByPageIDs(
      pages.map((item: any) => item._id),
      yDate
    )
    return {
      pages,
      input,
      sources,
      activePages,
      inactivePages
    }
  }

  @Authorized(['root', 'buchhalter', 'manager'])
  @Get('/v1/page/client')
  async getClientPages(
    @QueryParams() params: GetClientPagesParams
    ) {
    const { clientID, startDate, endDate, limit, offset, type } = params
    const [pagesData, total] = await this.pageRepository.getClientsPagesData({
      clientID: parseInt(clientID, 10),
      offset: parseInt(offset, 10),
      limit: parseInt(limit, 10),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type
    })
    // TODO: check it manager clientID
    return { pagesData, total }
  }

  @Authorized(['root', 'buchhalter'])
  @Get('/v1/page/clientsList')
  async getClients(
    @QueryParam('pageID') pageID: number
    ) {
    const clientsIDs = await this.pageRepository.getPageClients(pageID)
    const clientsNames = await this.clientRepository.convertIDtoName(clientsIDs)
    return clientsNames
  }

  @Authorized(['root', 'buchhalter', 'manager'])
  @Get('/v1/page/questions')
  async getQuestions(
    @QueryParams() params: GetQuestionParams,
    @CurrentUser({ required: true }) user: any
    ) {
    const { userID, role } = user
    const { startDate, endDate, limit, offset, type } = params
    const clients: any = []
    if (role === 'manager') {
      const userData = await this.userRepository.getOne(userID)
      clients.push(...userData.clients)
    }
    const [pageData, total] = await this.pageRepository.getQuestions({
      filter: '',
      offset: parseInt(offset, 10),
      limit: parseInt(limit, 10),
      type,
      clients,
      role
    })
    const pages = pageData.map((item: any) => item._id)
    const metricsData = await this.metricsRepository.getTotalByPage(
      new Date(startDate),
      new Date(endDate),
      pages
    )
    const metricsMap = totalByPage(metricsData)
    for (let i = 0; i < pageData.length; i++) {
      pageData[i].views = metricsMap[pageData[i]._id] || 0
    }
    return { pageData, views: metricsMap, total }
  }

  @HttpCode(204)
  @Patch('/v1/page/:pageID/status')
  async updateStatus(
    @Param('pageID') pageID: number,
    @Body() params: UpdateStatusParams
    ) {
    const { active } = params
    await this.pageRepository.updateStatus(pageID, active)
    // TODO: issue
    return ''
  }

  @Authorized(['root', 'buchhalter'])
  @Get('/v1/page/search')
  async searchPages(
    @QueryParams() params: SearchPagesParams
    ) {
    const { filter } = params
    const data = await this.pageRepository.search(filter, 5)
    const result = data.map((item: any) => ({
      value: item._id,
      text: item.title
    }))
    return result
  }

  @HttpCode(204)
  @Authorized(['root', 'manager'])
  @Post('/v1/page/bind')
  async bindClients(
    @Body() params: BindClientsParams
    ) {
    const { page, clients, minViews, maxViews, costPerClick, startDate, endDate } = params

    const bindPage = await this.pageRepository.getBindPage(page, clients)
    if (!(bindPage)) {
      throw new BadRequestError('INVALID_PAGE')
    }

    await this.pageRepository.bindClients({
      page,
      clients,
      minViews,
      maxViews,
      costPerClick,
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    })
    await this.metricsRepository.updateMetrics(page, startDate, endDate)
    // TODO: issue
    return ''
  }
}
