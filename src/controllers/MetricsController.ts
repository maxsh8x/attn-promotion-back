import { Service } from 'typedi'
import {
  Post, Body, JsonController, Authorized
} from 'routing-controllers'
import { IsUrl } from 'class-validator'

import { MetricsRepository } from '../repository/MetricsRepository'

export class CreateUrlParams {
  @IsUrl()
  url: string
}

@Service()
@JsonController()
export class MetricaController {
  constructor(
    private metricsRepository: MetricsRepository
  ) { }

  // @Authorized(['root'])
  @Post('/v1/page')
  async createPage(
    @Body() params: CreateUrlParams
  ) {
    const { url } = params
    const data = await this.metricsRepository.getYMetrics(url)
    const response = await this.metricsRepository.createMetrics(data)
    return response
  }
}
