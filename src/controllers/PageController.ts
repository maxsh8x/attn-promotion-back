import { Service } from 'typedi'
import {
  Get, Post, Body, JsonController, QueryParams, Authorized
} from 'routing-controllers'
import { IsUrl, IsString, IsPositive } from 'class-validator'

import { PageRepository } from '../repository/PageRepository'
import { getTitle } from '../utils/page'

export class CreatePageParams {
  @IsUrl()
  url: string

  @IsString()
  title: string
}

export class GetPageTitleParams {
  @IsUrl()
  url: string
}

export class GetPagesParams {
  @IsPositive()
  offset: string

  @IsPositive()
  limit: string
}

@Service()
@JsonController()
export class PageController {
  constructor(
    private pageRepository: PageRepository
  ) { }

  // @Authorized(['root'])
  @Post('/v1/page')
  async createPage(
    @Body() params: CreatePageParams
    ) {
    const { url, title } = params
    const data = await this.pageRepository.create({ url, title })
    return { pageID: data._id }
  }

  @Get('/v1/page/title')
  async getTitle(
    @QueryParams() params: GetPageTitleParams
    ) {
    const title = await getTitle(params.url)
    return { title }
  }

  @Get('/v1/page/')
  async getPages(
    @QueryParams() params: GetPagesParams
    ) {
    const { limit, offset } = params
    const data = await this.pageRepository.getAll(
      parseInt(limit, 10),
      parseInt(offset, 10)
    )
    return data
  }
}
