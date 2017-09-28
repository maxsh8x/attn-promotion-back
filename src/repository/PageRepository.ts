import { Service } from 'typedi'
import { Page } from '../models/Page'

// Add refresh tokens
@Service()
export class PageRepository {
  create(params: any): any {
    return Page.create(params)
  }

  getOne(pageID: number): any {
    return Page
      .findById(pageID)
      .lean()
      .exec()
  }
}
