import { Service } from 'typedi'
import { Page } from '../models/Page'
import { Archive } from '../models/Archive'
import { QUESTION_VARIANT_TYPE } from '../constants'
import { getViewsProjections } from '../utils/metrics';

const Fawn = require('fawn')

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

type types = 'all' | 'group' | 'individual'

interface IGetClientsPages {
  offset: number
  limit: number
  clientID: number
  startDate: Date
  endDate: Date
  type: types
}

interface IGetClientsTotal {
  startDate: Date
  endDate: Date
  clients: number[]
  type: types
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
    return Page.create(params)
  }

  getReportCampaigns(page: number, client: number) {
    return Promise.all([
      Page
        .findOne(
        { _id: page, 'meta.client': client },
        { meta: { $elemMatch: { client } } }
        )
        .lean()
        .exec(),
      Archive
        .find({ page, client }, '-_id startDate endDate')
        .lean()
        .exec()
    ]).then(
      ([activePages, archivePages]: [any, any]) => {
        const campaigns = []
        if (activePages) {
          for (let i = 0; i < activePages.meta.length; i += 1) {
            campaigns.push({
              startDate: activePages.meta[i].startDate,
              endDate: activePages.meta[i].endDate
            })
          }
        }
        for (let i = 0; i < archivePages.length; i++) {
          campaigns.push({
            startDate: archivePages[i].startDate,
            endDate: archivePages[i].endDate
          })
        }
        campaigns.sort(
          (a: any, b: any): any => +new Date(b.endDate) - +new Date(a.endDate)
        )
        return campaigns
      }
      )
  }

  archiveMeta(page: number, client: number) {
    return Page
      .findById(page, {
        url: 1,
        type: 1,
        meta: { $elemMatch: { client } }
      })
      .lean()
      .exec()
      .then((doc: any) =>
        Fawn.Task()
          .update('pages', { url: doc.url }, { $pull: { meta: { client } } })
          .save('archives', new Archive({
            type: doc.type,
            ...doc.meta[0],
            page
          }))
          .run({ useMongoose: true })
      )
  }

  getPageClientByURL(url: string, client: number): any {
    return Page
      .findOne(
      { url },
      { meta: { $elemMatch: { client } } }
      )
      .lean()
      .exec()
  }

  getOneWithClients(pageID: number): any {
    return Page
      .findById(pageID)
      .populate('meta.client')
      .lean()
      .exec()
  }

  getIndividualPageCounters(): any {
    const pipeline: any = [
      {
        $match: {
          active: true,
          type: 'individual',
          meta: {
            $exists: true,
            $ne: []
          }
        }
      },
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
          _id: 1,
          url: 1,
          counterID: { $arrayElemAt: ['$client.counterID', 0] }
        }
      }
    ]
    return Page
      .aggregate(pipeline)
      .exec()
  }

  getGroupPageCounters(): any {
    return Page
      .find({
        active: true,
        type: 'group',
        meta: {
          $exists: true,
          $ne: []
        }
      }, '_id url counterID'
      ).exec()
  }

  getClientsPages(client: number) {
    return Promise.all([
      Page
        .find({ 'meta.client': client })
        .lean()
        .exec(),
      Archive.find({ client })
        .populate('pageData')
        .lean()
        .exec()
    ]).then(([activePages, archivePages]: [any, any]) => {
      const pagesData = new Map()
      for (let i = 0; i < activePages.length; i++) {
        pagesData.set(
          activePages[i]._id,
          activePages[i].title
        )
      }
      for (let i = 0; i < archivePages.length; i++) {
        pagesData.set(
          archivePages[i].pageData._id,
          archivePages[i].pageData.title
        )
      }
      const result = []
      for (let value of pagesData.entries()) {
        result.push({
          id: value[0],
          title: value[1]
        })
      }
      return result
    })
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
      { $match: { _id: pageID } }
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
      { $unwind: '$meta' }
    ])

    if (!([clientsLimit, clientsOffset]).every(item => isNaN(item))) {
      pipeline.push(...[
        { $skip: clientsOffset },
        { $limit: clientsLimit }
      ])
    }

    pipeline.push(...[
      {
        $lookup: {
          from: 'clients',
          localField: 'meta.client',
          foreignField: '_id',
          as: 'client'
        }
      },
      {
        $graphLookup: {
          from: 'metrics',
          startWith: '$_id',
          connectFromField: 'page',
          connectToField: 'page',
          as: 'metrics',
          restrictSearchWithMatch: {
            type: 'total'
          }
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
          client: { $arrayElemAt: ['$client', 0] },
          views: {
            $reduce: {
              input: {
                $filter: {
                  input: '$metrics',
                  as: 'item',
                  cond: {
                    $and: [
                      { $gte: ['$$item.date', '$meta.startDate'] },
                      { $lte: ['$$item.date', '$meta.endDate'] }
                    ]
                  }
                }
              },
              initialValue: 0,
              in: { $add: ['$$value', '$$this.pageviews'] }
            }
          }
        }
      }
    ])
    return Page
      .aggregate(pipeline)
      .exec()
  }

  getClientsPagesData(params: IGetClientsPages) {
    const {
      offset,
      limit,
      startDate,
      endDate,
      clientID,
      type
    } = params

    const fields = [
      'url',
      'title',
      'type',
      '_id',
      'active'
    ].reduce(
      (p: any, c) => {
        p[c] = 1
        return p
      }, {})

    const queryCount: any = { 'meta.client': clientID }
    const pipeline: any = [
      { $match: { 'meta.client': clientID } }
    ]

    if (type !== 'all') {
      pipeline[0].$match.type = type
      queryCount.type = type
    }

    if (!([offset, limit]).every(item => isNaN(item))) {
      pipeline.push(...[
        { $skip: offset },
        { $limit: limit }
      ])
    }

    pipeline.push(...[
      {
        $project: {
          ...fields,
          meta: {
            $arrayElemAt: [{
              $filter: {
                input: '$meta',
                as: 'item',
                cond: { $eq: ['$$item.client', clientID] }
              }
            }, 0]
          }
        }
      },
      {
        $graphLookup: {
          from: 'metrics',
          startWith: '$_id',
          connectFromField: 'page',
          connectToField: 'page',
          as: 'metrics',
          restrictSearchWithMatch: {
            type: 'total'
          }
        }
      },
      {
        $project: {
          ...fields,
          costPerClick: '$meta.costPerClick',
          minViews: '$meta.minViews',
          maxViews: '$meta.maxViews',
          startDate: '$meta.startDate',
          endDate: '$meta.endDate',
          ...getViewsProjections(startDate, endDate)
        }
      }
    ])

    return Promise.all([
      Page
        .aggregate(pipeline)
        .exec(),
      Page.count(queryCount)
    ])
  }

  getPageClients(pageID: number) {
    return Page
      .distinct('meta.client', { _id: pageID })
  }

  getClientsTotal(params: IGetClientsTotal) {
    const { startDate, endDate, clients, type } = params
    const pipeline: any[] = [
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
          cost: { $sum: { $multiply: ['$costPerClick', '$views'] } },
          views: { $sum: '$views' }
        }
      }
    ]

    if (type !== 'all') {
      pipeline[0].$match.type = type
    }

    return Page
      .aggregate(pipeline)
      .exec()
  }

  getAll(params: IGetAllParams): any {
    const { limit, offset, active, filter, clients } = params
    const query: any = filter
      ? {
        $or: [
          { url: new RegExp(filter, 'i') },
          { title: new RegExp(filter, 'i') }
        ]
      }
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

  getPagesByURLs(urls: string[]): any {
    return Page.distinct('_id', { url: { $in: urls } })
  }

  getQuestions(params: IGetQuestionsParams): any {
    const { filter, clients, role, limit, offset, type } = params
    const query: any = {
      type
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
        .skip(offset)
        .limit(limit)
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

  getBindPage(page: number, clients: number[]) {
    return Page.findOne({
      _id: page,
      'meta.client': { $nin: clients }
    })
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
