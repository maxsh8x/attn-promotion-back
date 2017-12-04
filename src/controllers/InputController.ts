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
  IsString,
  Min,
  IsISO8601,
  IsNumberString
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

  @Min(0)
  value: number
}

export class GetInputParams {
  @IsISO8601()
  yDate: string

  @IsPositive()
  pageID: number
}

export class GetPageInputParams {
  @IsNumberString()
  pageID: string

  @IsISO8601()
  startDate: string

  @IsISO8601()
  endDate: string
}

@Service()
@JsonController()
export class MetricsController {
  constructor(
    private inputRepository: InputRepository
  ) { }

  @Authorized(['root', 'buchhalter'])
  @Get('/v1/input')
  async getPages(
    @QueryParams() params: GetPageInputParams
    ) {
    const {
      pageID,
      startDate,
      endDate
    } = params

    const inputPeriod = await this.inputRepository.getByPageIDs(
      [parseInt(pageID, 10)],
      new Date(startDate),
      new Date(endDate)
    )
    return inputPeriod
  }

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
