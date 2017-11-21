import { Service } from 'typedi'
import {
  Get,
  JsonController,
  Authorized,
  Param,
  OnUndefined,
  Post,
  Body
} from 'routing-controllers'
import {
  IsPositive
} from 'class-validator'
import { PageRepository } from '../repository/PageRepository'
import { ArchiveRepository } from '../repository/ArchiveRepository'

export class AchieveParams {
  @IsPositive()
  pageID: number

  @IsPositive()
  clientID: number
}

@Service()
@JsonController()
export class ClientController {
  constructor(
    private pageRepository: PageRepository,
    private archiveRepository: ArchiveRepository
  ) { }

  @Authorized(['root', 'buchhalter', 'manager'])
  @Get('/v1/archive/:pageID/client/:clientID')
  async getArchieve(
    @Param('pageID') pageID: number,
    @Param('clientID') clientID: number
  ) {
    const data = await this.archiveRepository.getArchive(pageID, clientID)
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
