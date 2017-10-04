import { Service } from 'typedi'
import { Page } from '../models/Page'

@Service()
export class PageRepository {
  create(params: any): any {
    return Page.findOne({ url: params.url }).then(
      (doc: any) => doc ? doc : Page.create(params)
    )
  }

  getOne(pageID: number): any {
    return Page
      .findById(pageID)
      .lean()
      .exec()
  }

  getAll(limit: number, offset: number, active: boolean): any {
    return Page
      .find({ active }, '_id createdAt url title active')
      .limit(limit)
      .skip(offset)
      .lean()
      .exec()
  }

  count(active = true): any {
    return Page.count({
      active
    })
  }

  getActivePagesURL(): any {
    return Page
      .find({ active: true }, '_id url')
      .lean()
      .exec()
  }

  updateStatus(pageID: number, active: boolean): any {
    return Page.findByIdAndUpdate(pageID, { active })
  }
}
