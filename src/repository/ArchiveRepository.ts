import { Service } from 'typedi'
import { Archive } from '../models/Archive'
import { getViewsProjections, getClicksCostsProjections } from '../utils/metrics';


type types = 'all' | 'group' | 'individual'

interface IGetArchiveBase {
  clientID: number
  startDate: Date
  endDate: Date
  type: types
}

interface IGetLatest extends IGetArchiveBase {
  offset: number
  limit: number
}

interface IGetHistorical extends IGetArchiveBase {
  pageID: number
}

@Service()
export class ArchiveRepository {
  getLatest(params: IGetLatest): any {
    const {
      clientID: client,
      startDate,
      endDate,
      offset,
      limit,
      type
    } = params
    const pagination = []
    if (!([offset, limit]).every(item => isNaN(item))) {
      pagination.push(...[
        { $skip: offset },
        { $limit: limit }
      ])
    }

    const matchStage: any = { $match: { client } }
    if (type !== 'all') {
      matchStage.$match.type = type
    }

    const pipeline: any = [
      matchStage,
      { $sort: { 'archivedAt': -1 } },
      {
        $group: {
          _id: {
            page: '$page',
            client: '$client'
          },
          meta: { $first: '$$ROOT' }
        }
      },
      ...pagination,
      {
        $graphLookup: {
          from: 'metrics',
          startWith: '$_id.page',
          connectFromField: 'page',
          connectToField: 'page',
          as: 'metrics',
          restrictSearchWithMatch: {
            type: 'total'
          }
        }
      },
      {
        $lookup: {
          from: 'pages',
          localField: '_id.page',
          foreignField: '_id',
          as: 'page'
        }
      },
      { $unwind: '$page' },
      {
        $lookup: {
          from: 'inputs',
          localField: 'meta.page',
          foreignField: 'page',
          as: 'inputs'
        }
      },
      {
        $project: {
          _id: '$meta.page',
          archiveID: '$meta._id',
          url: '$page.url',
          title: '$page.title',
          type: '$page.type',
          active: '$page.active',
          startDate: '$meta.startDate',
          endDate: '$meta.endDate',
          costPerClick: '$meta.costPerClick',
          targetClickCost: '$meta.targetClickCost',
          maxViews: '$meta.maxViews',
          minViews: '$meta.minViews',
          ...getViewsProjections(
            startDate,
            endDate,
            '$meta.startDate',
            '$meta.endDate'
          ),
          ...getClicksCostsProjections(
            '$meta.startDate',
            '$meta.endDate'
          )
        }
      }
    ]

    const countPipeline = [
      matchStage,
      {
        $group: {
          _id: {
            page: '$page',
            client: '$client'
          }
        }
      },
      {
        $count: 'total'
      }
    ]
    return Promise.all([
      Archive
        .aggregate(pipeline)
        .exec(),
      Archive
        .aggregate(countPipeline)
        .exec()
        .then(([doc]: any) => doc ? doc.total : 0)
    ])
  }

  getPageHistorical(params: IGetHistorical): any {
    const { clientID: client, pageID: page, startDate, endDate } = params
    const pipeline: any = [
      { $match: { client, page } },
      { $sort: { 'archivedAt': -1 } },
      { $skip: 1 },
      {
        $graphLookup: {
          from: 'metrics',
          startWith: '$page',
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
          _id: '$page',
          id: '$_id',
          startDate: '$startDate',
          endDate: '$endDate',
          costPerClick: '$costPerClick',
          targetClickCost: '$targetClickCost',
          maxViews: '$maxViews',
          minViews: '$minViews',
          ...getViewsProjections(
            startDate,
            endDate,
            '$startDate',
            '$endDate'
          )
        }
      }
    ]
    return Archive
      .aggregate(pipeline)
      .exec()
  }
}
