import { Service } from 'typedi'
import {
  Get, Post, Body, JsonController, Authorized, NotFoundError, HttpCode, QueryParams
} from 'routing-controllers'
import { IsPositive, IsString } from 'class-validator'

import { MetricsRepository } from '../repository/MetricsRepository'
import { PageRepository } from '../repository/PageRepository'
import { metricSources, metricFields } from '../constants'

export class UpdateMetricsParams {
  @IsPositive()
  pageID: number
}

export class GetMetricsParams {
  // TODO: check is date
  @IsString()
  yDate: string

  @IsPositive()
  pageID: number

  // @IsPositive()
  // limit: string

  // @IsPositive()
  // offset: string
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
    const { yDate, pageID } = params
    const data = await this.metricsRepository.getMetrics(yDate, pageID)
    return metricFields.map(metric => {
      const item: any = { metric }
      for (let i = 0; i < data.length; i++) {
        item[data[i]['type']] = data[i][metric]
      }
      return item
    })
  }
}
