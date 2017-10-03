import { Service } from 'typedi'
import {
  Get, Post, Body, JsonController, QueryParams, Authorized, Patch, Param
} from 'routing-controllers'
import { IsUrl, IsString, IsPositive, IsBooleanString, IsBoolean } from 'class-validator'

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
  @IsPositive()
  offset: string

  @IsPositive()
  limit: string

  @IsString()
  yDate: string

  @IsBooleanString()
  active: string
}

@Service()
@JsonController()
export class PageController {
  constructor(
    private pageRepository: PageRepository,
    private metricsRepository: MetricsRepository,
    private inputRepository: InputRepository
  ) { }

  // @Authorized(['root'])
  @Post('/v1/page')
  async createPage(
    @Body() params: CreatePageParams
    ) {
    const { url, title } = params
    // TODO: check if exist
    const { _id: pageID } = await this.pageRepository.create({ url, title })
    const metricsData = await this.metricsRepository.getYMetrics(url)
    if (Object.keys(metricsData.data).length > 0) {
      await this.metricsRepository.createMetrics({
        ...metricsData,
        pageID
      })
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

  @Get('/v1/page/count')
  async count(
    @QueryParams() params: CountParams
    ) {
    const { active } = params
    const isActive = (active === 'true');
    const count = await this.pageRepository.count(isActive)
    return count
  }

  @Get('/v1/page/')
  async getPages(
    @QueryParams() params: GetPagesParams
    ) {
    const { yDate, limit, offset, active } = params
    const isActive = (active === 'true')
    const pages = await this.pageRepository.getAll(
      parseInt(limit, 10),
      parseInt(offset, 10),
      isActive
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
