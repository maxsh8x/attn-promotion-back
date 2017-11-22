import { Service } from 'typedi'
import { Archive } from '../models/Archive'
import { getViewsProjections } from '../utils/metrics';

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
    const { clientID: client, startDate, endDate, offset, limit } = params
    const pagination = []
    if (!([offset, limit]).every(item => isNaN(item))) {
      pagination.push(...[
        { $skip: offset },
        { $limit: limit }
      ])
    }
    const pipeline: any = [
      { $match: { client } },
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
        $project: {
          _id: '$meta.page',
          startDate: '$meta.startDate',
          endDate: '$meta.endDate',
          costPerClick: '$meta.costPerClick',
          maxViews: '$meta.maxViews',
          minViews: '$meta.minViews',
          ...getViewsProjections(startDate, endDate)
        }
      }
    ]
    return Promise.all([
      Archive
        .aggregate(pipeline)
        .exec(),
      Archive.count({ client })
    ])
  }

  getHistorical(params: IGetHistorical): any {
    const { clientID: client, pageID: page } = params

    return Archive
      .find({ page, client })
      // .sort({ 'archivedAt': -1 })
      // .skip(1)
      // .lean()
      .exec()
  }
}
