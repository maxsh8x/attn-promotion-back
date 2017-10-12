import { Service } from 'typedi'
import {
  Get, Post, Body, JsonController, Authorized, NotFoundError, HttpCode, QueryParams
} from 'routing-controllers'
import { IsPositive, IsString, IsUrl, IsISO8601, IsNumberString } from 'class-validator'

import { MetricsRepository } from '../repository/MetricsRepository'
import { PageRepository } from '../repository/PageRepository'
import { InputRepository } from '../repository/InputRepository'
import { byMetric, convertToDate } from '../utils/metrics'
import { CHART_INTERVAL_TYPE } from '../constants'

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

  // TODO: enum
  @IsString()
  interval: CHART_INTERVAL_TYPE
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
    const { startDate, endDate, pageID, interval } = params
    const chartParams = {
      startDate,
      endDate,
      interval,
      pageID: parseInt(pageID, 10)
    }
    const metrics = await this.metricsRepository.getCostChart(chartParams)
    const inputs = await this.inputRepository.getCostChart(chartParams)

    const arrToMap = (arr: any[]) => {
      const result: { [s: string]: any } = {}
      for (let i = 0; i < arr.length; i++) {
        result[`${arr[i].primary}_${arr[i].secondary}`] = {
          value: arr[i].value,
          primary: arr[i].primary,
          secondary: arr[i].secondary
        }
      }
      return result
    }

    const metricsMap = arrToMap(metrics)
    const inputsMap = arrToMap(inputs)

    // TODO: check
    const result = []
    for (let prop in metricsMap) {
      if (prop in inputsMap) {
        result.push({
          x: convertToDate(
            metricsMap[prop].primary,
            metricsMap[prop].secondary,
            interval
          ),
          y: inputsMap[prop].value / metricsMap[prop].value
        })
      }
    }
    return result
  }
}
