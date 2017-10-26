import { Service } from 'typedi'
import { Page } from '../models/Page'

interface IGetAllParams {
  limit: number,
  offset: number,
  active: boolean,
  filter: string,
  clients: number[]
}

interface IBindClientParams {
  page: number
  clients: number[]
  minViews: number
  maxViews: number
  startDate: Date
  endDate: Date
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
      .populate('meta.client')
      .lean()
      .exec()
  }

  // check match projection
  getClientsTotal(startDate: Date, endDate: Date, clients: number[]) {
    const pipeline = [
      {
        $match: {
          'meta.client': { $in: clients }
        }
      },
      { $unwind: '$meta' },
      {
        $group: {
          _id: { client: '$meta.client', page: '$_id' }
        }
      },
      {
        $graphLookup: {
          from: 'metrics',
          startWith: '$_id.page',
          connectFromField: 'page',
          connectToField: 'page',
          as: 'doc',
          restrictSearchWithMatch: {
            type: 'ad',
            date: {
              $gte: startDate,
              $lte: endDate
            }
          }
        }
      },
      {
        $project: {
          _id: '$_id.client',
          views: { $sum: '$doc.pageviews' }
        }
      },
      {
        $group: {
          _id: '$_id',
          views: { $sum: '$views' }
        }
      }
    ]
    return Page
      .aggregate(pipeline)
      .exec()
  }

  getByClient(client: number): any {
    return Page
      .find(
      { 'meta.client': client },
      {
        url: 1,
        title: 1,
        type: 1,
        active: 1,
        meta: { $elemMatch: { client } }
      }
      )
      .lean()
      .exec()
  }

  getAll(params: IGetAllParams): any {
    const { limit, offset, active, filter, clients } = params
    const query: any = filter
      ? { $text: { $search: filter } }
      : {}
    if (clients.length > 0) {
      query['meta.client'] = { $in: clients }
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
    const query: any = {}
    if (filter) {
      query.$text = { $search: filter }
    }
    return Page
      .find(query, '_id title')
      .limit(limit)
      .lean()
      .exec()
  }

  bindClients(params: IBindClientParams): any {
    const {
      page,
      clients,
      minViews,
      maxViews,
      startDate,
      endDate
    } = params
    const docs = clients.map(client => ({
      client,
      minViews,
      maxViews,
      startDate,
      endDate
    }))
    return Page.update({ _id: page }, {
      $pushAll: { meta: docs }
    })
  }
}
