import { Service } from 'typedi'
import {
  Get, Post, Body, JsonController, QueryParams, Authorized
} from 'routing-controllers'
import { IsUrl, IsString, IsPositive, IsBoolean } from 'class-validator'

import { PageRepository } from '../repository/PageRepository'
import { MetricsRepository } from '../repository/MetricsRepository'
import { getTitle } from '../utils/page'

export class CreatePageParams {
  @IsUrl()
  url: string

  @IsString()
  title: string
}

export class GetPageTitleParams {
  @IsUrl()
  url: string
}

export class CountParams {
  @IsBoolean()
  active: boolean
}

export class GetPagesParams {
  @IsPositive()
  offset: string

  @IsPositive()
  limit: string

  @IsString()
  yDate: string
}

@Service()
@JsonController()
export class PageController {
  constructor(
    private pageRepository: PageRepository,
    private metricsRepository: MetricsRepository,
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
    const count = await this.pageRepository.count(active)
    return count
  }

  @Get('/v1/page/')
  async getPages(
    @QueryParams() params: GetPagesParams
    ) {
    const { yDate, limit, offset } = params
    const data = await this.pageRepository.getAll(
      yDate,
      parseInt(limit, 10),
      parseInt(offset, 10)
    )
    return data
  }
}
