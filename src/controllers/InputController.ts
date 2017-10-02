import { Service } from 'typedi'
import {
  Post, Body, JsonController, Authorized, NotFoundError, HttpCode, QueryParams
} from 'routing-controllers'
import { IsPositive, IsString } from 'class-validator'

import { InputRepository } from '../repository/InputRepository'

export class UpdateInputParams {
  @IsString()
  source: string

  @IsString()
  type: string

  @IsPositive()
  pageID: number

  @IsString()
  yDate: string

  @IsPositive()
  value: number
}

@Service()
@JsonController()
export class MetricsController {
  constructor(
    private inputRepository: InputRepository
  ) { }

  // @Authorized(['root'])
  @Post('/v1/input')
  async updateInput(
    @Body() params: UpdateInputParams
    ) {
    const {
      source,
      type,
      pageID,
      yDate,
      value
      } = params
    await this.inputRepository.update({
      source,
      type,
      pageID,
      yDate,
      value
    })
    return 'ok'
  }
}
