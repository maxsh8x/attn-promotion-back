import { Service } from 'typedi'
import {
  Get, Post, Body, JsonController, QueryParams, Authorized
} from 'routing-controllers'
import { IsUrl, IsString, IsPositive, IsBooleanString } from 'class-validator'

import { PageRepository } from '../repository/PageRepository'
import { MetricsRepository } from '../repository/MetricsRepository'
import { InputRepository } from '../repository/InputRepository'
import { getTitle } from '../utils/page'

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
    const isActive = (active === 'true');
    const pageIDs = await this.pageRepository.getIDs(
      parseInt(limit, 10),
      parseInt(offset, 10),
      isActive
    )
    const data = await this.inputRepository.getByPageIDs(
      pageIDs.map((item: any) => item._id),
      yDate
    )
    return data
  }
}
