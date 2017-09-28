import { Service } from 'typedi'
import {
  Get, Post, Body, JsonController, Authorized, NotFoundError, HttpCode, QueryParams
} from 'routing-controllers'
import { IsPositive } from 'class-validator'

import { MetricsRepository } from '../repository/MetricsRepository'
import { PageRepository } from '../repository/PageRepository'

export class UpdateMetricsParams {
  @IsPositive()
  pageID: number
}

export class GetMetricsParams {
  @IsPositive()
  pageID: number

  @IsPositive()
  limit: string

  @IsPositive()
  offset: string
}

@Service()
@JsonController()
export class MetricsController {
  constructor(
    private metricsRepository: MetricsRepository,
    private pageRepository: PageRepository
  ) { }

  // @Authorized(['root'])
  @Post('/v1/metrics')
  async updateMetrics(
    @Body() params: UpdateMetricsParams
    ) {
    const { pageID } = params
    const pageData = await this.pageRepository.getOne(pageID)
    if (pageData === null) {
      throw new NotFoundError('PageID not found')
    }
    const { url } = pageData
    const data = await this.metricsRepository.getYMetrics(url)
    if (Object.keys(data.data).length) {
      await this.metricsRepository.createMetrics({
        ...data,
        pageID
      })
    }
    return 'ok'
  }

  @Get('/v1/metrics')
  async getMetrics(
    @QueryParams() params: GetMetricsParams
    ) {
    const { limit, offset, pageID } = params
    return await this.metricsRepository.getAll(
      pageID,
      parseInt(limit, 10),
      parseInt(offset, 10)
    )
  }
}
