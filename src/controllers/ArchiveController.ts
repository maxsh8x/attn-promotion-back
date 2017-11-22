import { Service } from 'typedi'
import {
  Get,
  JsonController,
  Authorized,
  Param,
  OnUndefined,
  Post,
  Body,
  QueryParams
} from 'routing-controllers'
import {
  IsPositive,
  IsOptional,
  IsISO8601,
  IsNumberString,
  IsIn
} from 'class-validator'
import { PageRepository } from '../repository/PageRepository'
import { ArchiveRepository } from '../repository/ArchiveRepository'

export class AchieveParams {
  @IsPositive()
  pageID: number

  @IsPositive()
  clientID: number
}

class BaseGetArchiveParams {
  @IsISO8601()
  startDate: string

  @IsISO8601()
  endDate: string

  @IsNumberString()
  clientID: string

  @IsIn(['all', 'group', 'individual'])
  type: 'all' | 'group' | 'individual'
}

class GetLatestParams extends BaseGetArchiveParams {
  @IsOptional()
  offset: string

  @IsOptional()
  limit: string
}

class GetHistoricalParams extends BaseGetArchiveParams {
  @IsNumberString()
  pageID: string
}

@Service()
@JsonController()
export class ClientController {
  constructor(
    private pageRepository: PageRepository,
    private archiveRepository: ArchiveRepository
  ) { }

  @Authorized(['root', 'buchhalter', 'manager'])
  @Get('/v1/archive/latest/')
  async getLatest(
    @QueryParams() params: GetLatestParams
    ) {
    const { offset, limit, clientID, startDate, endDate, type } = params
    const [archiveData, total] = await this.archiveRepository.getLatest({
      offset: parseInt(offset, 10),
      limit: parseInt(limit, 10),
      clientID: parseInt(clientID, 10),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type
    })
    return { archiveData, total }
  }

  @Authorized(['root', 'buchhalter', 'manager'])
  @Get('/v1/archive/pageHistorical/')
  async getPageHistorical(
    @QueryParams() params: GetHistoricalParams
    ) {
    const { clientID, pageID, startDate, endDate, type } = params
    const data = await this.archiveRepository.getPageHistorical({
      clientID: parseInt(clientID, 10),
      pageID: parseInt(pageID, 10),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type
    })
    return data
  }

  @OnUndefined(204)
  @Post('/v1/archive')
  async toArchieve(
    @Body() params: AchieveParams
    ) {
    const { pageID, clientID } = params
    await this.pageRepository.archiveMeta(pageID, clientID)
  }
}
