import { Service } from 'typedi'
import { Page } from '../models/Page'
import { QUESTION_VARIANT_TYPE } from '../constants'

interface IGetAllParams {
  limit: number,
  offset: number,
  active: boolean,
  filter: string,
  clients: number[]
}

interface IGetPageClientsParams {
  clientsOffset: number
  clientsLimit: number
  pageID: number
  clients: number[]
  role: string
}

interface IBindClientParams {
  page: number
  clients: number[]
  minViews: number
  maxViews: number
  costPerClick: number
  startDate: Date
  endDate: Date
}

interface IGetQuestionsParams {
  limit: number
  offset: number
  filter: string
  clients: number[]
  role: string
  type: QUESTION_VARIANT_TYPE
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

  getPageClientsData(params: IGetPageClientsParams): any {
    const {
      clientsOffset,
      clientsLimit,
      pageID,
      clients,
      role
    } = params
    const pipeline: any = [
      { $match: { _id: pageID } },
    ]
    if (clients.length > 0 || role === 'manager') {
      pipeline.push(
        {
          $project: {
            meta: {
              $filter: {
                input: '$meta',
                as: 'meta',
                cond: { $in: ['$$meta.client', clients] }
              }
            }
          }
        }
      )
    }

    pipeline.push(...[
      { $project: { meta: 1, total: { $size: '$meta' } } },
      { $unwind: '$meta' },
      { $skip: clientsOffset },
      { $limit: clientsLimit },
      {
        $lookup: {
          from: 'clients',
          localField: 'meta.client',
          foreignField: '_id',
          as: 'client'
        }
      },
      {
        $project: {
          endDate: '$meta.endDate',
          startDate: '$meta.startDate',
          costPerClick: '$meta.costPerClick',
          maxViews: '$meta.maxViews',
          minViews: '$meta.minViews',
          total: '$total',
          client: { $arrayElemAt: ['$client', 0] }
        }
      }
    ])
    return Page
      .aggregate(pipeline)
      .exec()
  }

  getPageClients(pageID: number) {
    return Page
      .distinct('meta.client', { _id: pageID })
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
          _id: {
            client: '$meta.client',
            costPerClick: '$meta.costPerClick',
            page: '$_id'
          }
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
            type: 'total',
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
          costPerClick: '$_id.costPerClick',
          views: { $sum: '$doc.pageviews' }
        }
      },
      {
        $group: {
          _id: '$_id',
          costPerClick: { $sum: '$costPerClick' },
          views: { $sum: '$views' }
        }
      }
    ]
    return Page
      .aggregate(pipeline)
      .exec()
  }

  getByClient(client: number, limit: number, offset: number): any {
    const query: any = { 'meta.client': client }
    return Promise.all([
      Page
        .find(query,
        {
          url: 1,
          title: 1,
          type: 1,
          active: 1,
          meta: { $elemMatch: { client } }
        }
        )
        .lean()
        .exec(),
      Page.count(query)
    ])
  }

  getAll(params: IGetAllParams): any {
    const { limit, offset, active, filter, clients } = params
    const query: any = filter
      ? { $text: { $search: filter } }
      : {}
    if (clients.length > 0) {
      query['meta.client'] = { $in: clients }
    }
    return Promise.all([
      Page
        .find({ ...query, active }, '_id createdAt url title active type')
        .limit(limit)
        .skip(offset)
        .lean()
        .exec(),
      Page.count({ ...query, active: true }),
      Page.count({ ...query, active: false }),
    ])
  }

  getActivePagesURL(): any {
    return Page
      .find({ active: true }, '_id url')
      .lean()
      .exec()
  }

  getIndividualRelatedClients(): any {
    return Page.
      find({
        active: true,
        type: { $in: ['individual', 'related'] }
      })
      .cursor()
  }

  getPagesByURLs(urls: string[]): any {
    return Page.distinct('_id', { url: { $in: urls } })
  }

  getQuestions(params: IGetQuestionsParams): any {
    const { filter, clients, role, limit, offset } = params
    const query: any = {
      type: 'group'
    }
    const projection: any = {
      url: 1,
      title: 1,
      active: 1
    }

    // if (filter) {
    //   query.$text = { $search: filter }
    // }

    // TODO: meta.client
    if (clients.length > 0 || role === 'manager') {
      query['meta.client'] = { $in: clients }
      projection.meta = { $elemMatch: { client: { $in: clients } } }
    }

    return Promise.all([
      Page
        .find(query, projection)
        .lean()
        .exec(),
      Page.count(query)
    ])
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
      costPerClick,
      startDate,
      endDate
    } = params
    const docs = clients.map(client => ({
      client,
      minViews,
      maxViews,
      costPerClick,
      startDate,
      endDate
    }))
    return Page.update({ _id: page }, {
      $pushAll: { meta: docs }
    })
  }
}
