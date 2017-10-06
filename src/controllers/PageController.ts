import { Service } from 'typedi'
import {
  Get, Post, Body, JsonController, QueryParams, Authorized, Patch, Param
} from 'routing-controllers'
import { IsUrl, IsString, IsBooleanString, IsBoolean, IsNumberString } from 'class-validator'

import { PageRepository } from '../repository/PageRepository'
import { MetricsRepository } from '../repository/MetricsRepository'
import { InputRepository } from '../repository/InputRepository'
import { getTitle } from '../utils/page'
import { metricNetworks } from '../constants'

export class CreatePageParams {
  @IsUrl()
  url: string

  @IsString()
  title: string
}

// TODO: report bug queryparam validation
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
}

@Service()
@JsonController()
export class PageController {
  constructor(
    private pageRepository: PageRepository,
    private metricsRepository: MetricsRepository,
    private inputRepository: InputRepository
  ) { }

  @Authorized(['root'])
  @Post('/v1/page')
  async createPage(
    @Body() params: CreatePageParams
    ) {
    const { url } = params
    let { title } = params
    if (title.length === 0) {
      title = await getTitle(url)
    }
    const data = await this.pageRepository.create({ url, title })
    const { _id: pageID } = data
    const metricsData = await this.metricsRepository.getYMetrics(url)
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
    const isActive = (active === 'true');
    const count = await this.pageRepository.count(isActive)
    return count
  }

  @Authorized(['root'])
  @Get('/v1/page/')
  async getPages(
    @QueryParams() params: GetPagesParams
    ) {
    const { yDate, limit, offset, filter, active } = params
    const isActive = (active === 'true')
    const pages = await this.pageRepository.getAll(
      parseInt(limit, 10),
      parseInt(offset, 10),
      isActive,
      filter
    )
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

  @Patch('/v1/page/:pageID/status')
  async updateStatus(
    @Param('pageID') pageID: number,
    @Body() params: UpdateStatusParams
    ) {
    const { active } = params
    await this.pageRepository.updateStatus(pageID, active)
    return 'ok'
  }
}
