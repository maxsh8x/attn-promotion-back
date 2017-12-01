import { Service } from 'typedi'
import {
  Get,
  Post,
  Body,
  JsonController,
  Authorized,
  OnUndefined,
  QueryParams
} from 'routing-controllers'
import {
  IsPositive,
  IsUrl,
  IsISO8601,
  IsNumberString,
  IsIn
} from 'class-validator'

import { MetricsRepository } from '../repository/MetricsRepository'
import { PageRepository } from '../repository/PageRepository'
import { InputRepository } from '../repository/InputRepository'
import { ClientRepository } from '../repository/ClientRepository'
import { byMetricDay, byMetricPeriod, convertToDate } from '../utils/metrics'
import { CHART_INTERVAL_TYPE, CHART_INTERVAL_ARRAY } from '../constants'

export class UpdateMetricsParams {
  @IsPositive()
  pageID: number

  @IsISO8601()
  startDate: string

  @IsISO8601()
  endDate: string
}

export class GetMetricsDayParams {
  @IsISO8601()
  yDate: string

  @IsNumberString()
  pageID: string
}

export class GetMetricsPeriodParams {
  @IsISO8601()
  startDate: string

  @IsISO8601()
  endDate: string

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

  @IsIn(CHART_INTERVAL_ARRAY)
  interval: CHART_INTERVAL_TYPE
}

export class ReportParams {
  @IsISO8601()
  startDate: string

  @IsISO8601()
  endDate: string

  @IsNumberString()
  pageID: string

  @IsNumberString()
  clientID: string
}

@Service()
@JsonController()
export class MetricsController {
  constructor(
    private metricsRepository: MetricsRepository,
    private pageRepository: PageRepository,
    private inputRepository: InputRepository,
    private clientRepository: ClientRepository
  ) { }

  @OnUndefined(204)
  @Authorized(['root'])
  @Post('/v1/metrics')
  async updateMetrics(
    @Body() params: UpdateMetricsParams
    ) {
    const { pageID, startDate, endDate } = params
    await this.metricsRepository.updateMetrics(pageID, startDate, endDate)
  }

  @Authorized(['root', 'buchhalter'])
  @Get('/v1/metrics/day')
  async getMetricsByDay(
    @QueryParams() params: GetMetricsDayParams
    ) {
    const { yDate, pageID } = params
    const data = await this.metricsRepository.getMetrics(yDate, parseInt(pageID, 10))
    const result = byMetricDay(data)
    return result
  }

  @Authorized(['root', 'buchhalter'])
  @Get('/v1/metrics/period')
  async getMetricsPeriod(
    @QueryParams() params: GetMetricsPeriodParams
    ) {
    const { startDate, endDate, pageID } = params
    const data = await this.metricsRepository.getMetricsPeriodData(
      parseInt(pageID, 10),
      startDate,
      endDate
    )
    const result = byMetricPeriod(data)
    return result
  }

  @Authorized(['root', 'buchhalter', 'manager'])
  @Get('/v1/metrics/report')
  async getReport(
    @QueryParams() params: ReportParams
    ) {
    const { startDate, endDate, pageID, clientID } = params
    const data = await this.metricsRepository.getReport({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      pageID: parseInt(pageID, 10)
    })
    return data
  }

  @Authorized(['root', 'buchhalter'])
  @Post('/v1/metrics/linechart')
  async lineChart(
    @Body() params: LineChartParams
    ) {
    const { startDate, endDate, urls } = params
    const pages = await this.pageRepository.getPagesByURLs(urls)
    const data = await this.metricsRepository.lineChart(
      new Date(startDate),
      new Date(endDate),
      pages
    )
    return { data }
  }

  @Authorized(['root', 'buchhalter'])
  @Get('/v1/metrics/promotionChart')
  async promotionChart(
    @QueryParams() params: PromotionChartParams
    ) {
    const { startDate, endDate, pageID, interval } = params
    const chartParams = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
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
