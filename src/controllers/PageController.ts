import { Service } from 'typedi'
import {
  Get,
  Post,
  Body,
  JsonController,
  QueryParams,
  Authorized,
  Patch,
  Param,
  HttpCode
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
  Max,
  IsISO8601,
  ValidateIf
} from 'class-validator'

import { PageRepository } from '../repository/PageRepository'
import { MetricsRepository } from '../repository/MetricsRepository'
import { InputRepository } from '../repository/InputRepository'
import { ClientRepository } from '../repository/ClientRepository'
import { getTitle } from '../utils/page'
import { sources, QUESTION_VARIANT_TYPE, QUESTION_VARIANT_ARRAY } from '../constants'

export class CreatePageParams {
  @IsUrl()
  url: string

  @ValidateIf(o => o.type === 'individual')
  @IsPositive()
  client: number

  @IsIn(QUESTION_VARIANT_ARRAY)
  type: QUESTION_VARIANT_TYPE

  @ValidateIf(o => o.type === 'related')
  @IsPositive()
  parent: number

  @ValidateIf(o => o.type === 'group')
  @Min(10000000)
  @Max(99999999)
  counterID: number
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

export class SearchPagesParams {
  @IsString()
  filter: string
}

export class BindClientsParams {
  @IsPositive()
  page: number

  @IsPositive({
    each: true
  })
  clients: number[]

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
    const { url, client, type, parent } = params
    const title = await getTitle(url)
    const data = await this.pageRepository.create({ url, title, type, parent })
    const { _id: pageID } = data
    let counterID: number | null = null
    if (type === 'group') {
      counterID = params.counterID
    } else {
      const clientData = await this.clientRepository.getOne(client)
      counterID = clientData.counterID
    }
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

  @Authorized(['root', 'buchhalter'])
  @Get('/v1/page/title')
  async getTitle(
    @QueryParams() params: GetPageTitleParams
    ) {
    const title = await getTitle(params.url)
    return { title }
  }

  @Authorized(['root', 'buchhalter'])
  @Get('/v1/page/count')
  async count(
    @QueryParams() params: CountParams
    ) {
    const { active } = params
    const isActive = (active === 'true')
    const count = await this.pageRepository.count(isActive)
    return count
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
      sources,
      activePages,
      inactivePages
    }
  }

  @Authorized(['root', 'buchhalter'])
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

  @Authorized(['root'])
  @Get('/v1/page/group-questions')
  async groupQuestions(
    ) {
    return await this.pageRepository.getGroupQuestions()
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
  @Authorized(['root'])
  @Post('/v1/page/bind')
  async bindClients(
    @Body() params: BindClientsParams
    ) {
    const { page, clients, minViews, maxViews, startDate, endDate } = params
    await this.pageRepository.bindClients({
      page,
      clients,
      minViews,
      maxViews,
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    })
    // TODO: issue
    return ''
  }
}
