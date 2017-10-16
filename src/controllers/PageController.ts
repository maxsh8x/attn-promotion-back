import { Service } from 'typedi'
import {
  Get, Post, Body, JsonController, QueryParams, Authorized, Patch, Param, HttpCode, BadRequestError
} from 'routing-controllers'
import { IsUrl, IsString, IsBooleanString, IsBoolean, IsNumberString, IsPositive, IsIn, IsOptional, IsISO8601 } from 'class-validator'

import { PageRepository } from '../repository/PageRepository'
import { MetricsRepository } from '../repository/MetricsRepository'
import { InputRepository } from '../repository/InputRepository'
import { ClientRepository } from '../repository/ClientRepository'
import { getTitle } from '../utils/page'
import { metricNetworks, QUESTION_VARIANT_TYPE, QUESTION_VARIANT_ARRAY } from '../constants'

export class CreatePageParams {
  @IsUrl()
  url: string

  @IsString()
  title: string

  @IsPositive()
  clientID: number

  @IsIn(QUESTION_VARIANT_ARRAY)
  type: QUESTION_VARIANT_TYPE

  @IsOptional()
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

export class GetPagesParams {
  @IsNumberString()
  offset: string

  @IsNumberString()
  limit: string

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
  @IsISO8601()
  startDate: string

  @IsISO8601()
  endDate: string

  @IsNumberString()
  clientID: string
}

@Service()
@JsonController()
export class PageController {
  constructor(
    private pageRepository: PageRepository,
    private metricsRepository: MetricsRepository,
    private inputRepository: InputRepository,
    private clientRepository: ClientRepository
  ) { }

  @Authorized(['root'])
  @Post('/v1/page')
  async createPage(
    @Body() params: CreatePageParams
    ) {
    const { url, clientID: client, type, parent } = params
    let { title } = params
    if (type === 'related' && typeof parent !== 'number') {
      // TODO: check parent exist && add to obj if related only
      throw new BadRequestError('INVALID_PARENT')
    }
    if (title.length === 0) {
      title = await getTitle(url)
    }
    const data = await this.pageRepository.create({ url, title, client, type, parent })
    const { _id: pageID } = data
    // CounterID to cache
    const { counterID } = await this.clientRepository.getOne(client)
    const metricsData = await this.metricsRepository.getYMetrics(url, counterID)
    if (Object.keys(metricsData.data).length > 0) {
      try {
        await this.metricsRepository.createMetrics([{
          ...metricsData,
          pageID
        }])
      } catch (e) {
        // TODO: sentry
      }
    }
    return { pageID }
  }

  @Get('/v1/page/title')
  async getTitle(
    @QueryParams() params: GetPageTitleParams
    ) {
    const title = await getTitle(params.url)
    return { title }
  }

  @Authorized(['root'])
  @Get('/v1/page/count')
  async count(
    @QueryParams() params: CountParams
    ) {
    const { active } = params
    const isActive = (active === 'true')
    const count = await this.pageRepository.count(isActive)
    return count
  }

  @Authorized(['root'])
  @Get('/v1/page/')
  async getPages(
    @QueryParams() params: GetPagesParams
    ) {
    const { yDate, limit, offset, filter, active, clients: rawClients } = params
    const clients = rawClients
      .split(',')
      .filter(x => parseInt(x, 10))
      .map(x => parseInt(x, 10))
    const isActive = (active === 'true')
    const pages = await this.pageRepository.getAll({
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
    const activePages = await this.pageRepository.count(true)
    const inactivePages = await this.pageRepository.count(false)
    return {
      pages,
      input,
      metricNetworks,
      activePages,
      inactivePages
    }
  }

  @Authorized(['root'])
  @Get('/v1/page/client')
  async getClientPages(
    @QueryParams() params: GetClientPagesParams
    ) {
    const { clientID, startDate, endDate } = params
    const pageData = await this.pageRepository.getByClient(
      parseInt(clientID, 10)
    )
    const pages = await this.pageRepository.getClientPagesID(
      parseInt(clientID, 10)
    )
    const metricsData = await this.metricsRepository.getTotal(startDate, endDate, pages)
    const metricsMap: any = {}
    for (let i = 0; i < metricsData.length; i++) {
      metricsMap[metricsData[i]._id] = metricsData[i].value
    }
    for (let i = 0; i < pageData.length; i++) {
      pageData[i].views = metricsMap[pageData[i]._id] || 0
    }
    return pageData
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
}
