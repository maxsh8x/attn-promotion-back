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

  getIDs(limit: number, offset: number, active: boolean): any {
    // return Page
    // .find({ active }, '_id createdAt url title')
    // .limit(limit)
    // .skip(offset)
    // .populate({
    //   path: 'input',
    //   match: {
    //     date: yDate
    //   },
    //   select: '-_id page source type value'
    // })
    // .lean()
    // .exec()
    const pipeline: any = [
      { $match: { active } },
      { $group: { _id: '$_id' } },
      { $skip: offset },
      { $limit: limit }
    ]
    return Page
      .aggregate(pipeline)
      .exec()
  }

  count(active = true): any {
    return Page.count({
      active
    })
  }
}
