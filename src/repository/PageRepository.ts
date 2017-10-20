import { Service } from 'typedi'
import { Page } from '../models/Page'

interface IGetAllParams {
  limit: number,
  offset: number,
  active: boolean,
  filter: string,
  clients: number[]
}

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

  getByClient(client: number): any {
    return Page
      .find({ client }, '_id active url title type parent')
      .lean()
      .exec()
  }

  getClientPagesID(client: number): any {
    return Page.distinct('_id', { client })
  }

  getAll(params: IGetAllParams): any {
    const { limit, offset, active, filter, clients } = params
    const query: any = filter
      ? { $text: { $search: filter } }
      : {}
    if (clients.length > 0) {
      query.client = { $in: clients }
    }
    return Page
      .find({ ...query, active }, '_id createdAt url title active type')
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
      .find({ active: true }, '_id client url')
      .lean()
      .exec()
  }

  getPagesByURLs(urls: string[]): any {
    return Page.distinct('_id', { url: { $in: urls } })
  }

  getGroupQuestions(): any {
    return Page
      .find({
        type: 'group'
      })
      .lean()
      .exec()
  }

  updateStatus(pageID: number, active: boolean): any {
    return Page.findByIdAndUpdate(pageID, { active })
  }

  search(filter: string, limit: number): any {
    const query = filter
      ? { $text: { $search: filter } }
      : {}
    return Page
      .find(query, '_id title')
      .limit(limit)
      .lean()
      .exec()
  }
}
