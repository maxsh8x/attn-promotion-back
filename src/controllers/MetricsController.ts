import { Service } from 'typedi'
import {
  Get, Post, Body, JsonController, Authorized, NotFoundError, HttpCode, QueryParams
} from 'routing-controllers'
import { IsPositive, IsString, IsUrl, IsISO8601, IsNumberString } from 'class-validator'

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
  @IsISO8601()
  yDate: string

  @IsNumberString()
  pageID: string
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

export class PromotionChartParams {
  @IsISO8601()
  startDate: string

  @IsISO8601()
  endDate: string

  @IsNumberString()
  pageID: string
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
  }

  @Authorized(['root'])
  @Get('/v1/metrics')
  async getMetrics(
    @QueryParams() params: GetMetricsParams
    ) {
    const { yDate, pageID } = params
    const data = await this.metricsRepository.getMetrics(yDate, parseInt(pageID, 10))
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

  @Authorized(['root'])
  @Get('/v1/metrics/promotionChart')
  async promotionChart(
    @QueryParams() params: PromotionChartParams
    ) {
    const { startDate, endDate, pageID } = params
    const data = await this.metricsRepository.promotionChart(
      startDate,
      endDate,
      parseInt(pageID, 10)
    )
    return { data }
  }
}
