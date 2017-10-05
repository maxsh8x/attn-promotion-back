import { Service } from 'typedi'
import {
  Post, Body, JsonController, Authorized, HttpCode
} from 'routing-controllers'
import { IsPositive, IsString, IsInt } from 'class-validator'
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

  @IsInt()
  value: number
}

export class GetInputParams {
  // TODO: check is date
  @IsString()
  yDate: string

  @IsPositive()
  pageID: number
}

@Service()
@JsonController()
export class MetricsController {
  constructor(
    private inputRepository: InputRepository
  ) { }

  @HttpCode(204)
  @Authorized(['root'])
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
    // TODO: issue
    return ''
  }
}
