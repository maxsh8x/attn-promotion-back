import { Service } from 'typedi'
import { Page } from '../models/Page'

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

  getAll(yDate: string, limit: number, offset: number): any {
    return Page
      .find({}, '_id createdAt url title')
      .limit(limit)
      .skip(offset)
      .populate({
        path: 'data',
        match: {
          date: yDate
        }
      })
      .lean()
      .exec()
  }
}
