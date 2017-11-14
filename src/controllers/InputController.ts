import { Service } from 'typedi'
import {
  Post,
  Body,
  JsonController,
  Authorized,
  OnUndefined
} from 'routing-controllers'
import {
  IsPositive,
  IsString,
  IsNumber,
  IsISO8601
} from 'class-validator'
import { InputRepository } from '../repository/InputRepository'

export class UpdateInputParams {
  @IsString()
  source: string

  @IsString()
  type: string

  @IsPositive()
  pageID: number

  @IsISO8601()
  yDate: string

  @IsNumber()
  value: number
}

export class GetInputParams {
  @IsISO8601()
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

  @OnUndefined(204)
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
  }
}
