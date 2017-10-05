import { Service } from 'typedi'
import {
  Get, Post, Body, JsonController, Authorized, NotFoundError, HttpCode, QueryParams
} from 'routing-controllers'
import { IsPositive, IsString, IsUrl, IsISO8601 } from 'class-validator'

import { MetricsRepository } from '../repository/MetricsRepository'
import { PageRepository } from '../repository/PageRepository'
import { InputRepository } from '../repository/InputRepository'
import { byMetric } from '../utils/metrics'

export class UpdateMetricsParams {
  @IsPositive()
  pageID: number

  @IsString()
  yDate: string
}

export class GetMetricsParams {
  @IsString()
  yDate: string

  @IsPositive()
  pageID: number
}

export class LineChartParams {
  @IsISO8601()
  startDate: string

  @IsISO8601()
  endDate: string

  @IsUrl({}, {
    each: true
  })
  urls: string[]
}

@Service()
@JsonController()
export class MetricsController {
  constructor(
    private metricsRepository: MetricsRepository,
    private pageRepository: PageRepository,
    private inputRepository: InputRepository
  ) { }

  @HttpCode(204)
  @Authorized(['root'])
  @Post('/v1/metrics')
  async updateMetrics(
    @Body() params: UpdateMetricsParams
    ) {
    const { pageID, yDate } = params
    const pageData = await this.pageRepository.getOne(pageID)
    if (pageData === null) {
      throw new NotFoundError('PageID not found')
    }
    const { url } = pageData
    const data = await this.metricsRepository.getYMetrics(url, yDate)
    if (Object.keys(data.data).length > 0) {
      await this.metricsRepository.createMetrics([{
        ...data,
        pageID
      }])
    }
    // TODO: issue
    return ''
  }

  @Authorized(['root'])
  @Get('/v1/metrics')
  async getMetrics(
    @QueryParams() params: GetMetricsParams
    ) {
    const { yDate, pageID } = params
    const data = await this.metricsRepository.getMetrics(yDate, pageID)
    const result = byMetric(data)
    return result
  }

  @Authorized(['root'])
  @Post('/v1/metrics/linechart')
  async lineChart(
    @Body() params: LineChartParams
    ) {
    const { startDate, endDate, urls } = params
    const pages = await this.pageRepository.getPagesByURLs(urls)
    const data = await this.metricsRepository.lineChart(startDate, endDate, pages)
    return { data }
  }
}
