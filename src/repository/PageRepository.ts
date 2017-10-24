import { Service } from 'typedi'
import { Page } from '../models/Page'
import { PageMeta } from '../models/PageMeta'

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
      .lean()
      .exec()
  }

  getTotalByClients(clients: number[]) {
    const pipeline = [
      {
        $match: {
          client: { $in: clients }
        }
      }
    ]
    return PageMeta
      .aggregate(pipeline)
      .exec()
  }

  getByClient(client: number): any {
    const pipeline = [
      {
        $match: {
          client
        }
      },
      {
        $lookup: {
          from: 'pages',
          localField: 'page',
          foreignField: '_id',
          as: 'page_doc'
        }
      },
      {
        $unwind: '$page_doc'
      },
      {
        $project: {
          _id: '$page_doc._id',
          active: '$page_doc.active',
          url: '$page_doc.url',
          title: '$page_doc.title',
          type: '$page_doc.type',
          parent: '$page_doc.parent'
        }
      }
    ]
    return PageMeta
      .aggregate(pipeline)
      .exec()
  }

  getByPage(page: number): any {
    const pipeline = [
      {
        $match: {
          page
        }
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'client',
          foreignField: '_id',
          as: 'client_doc'
        }
      },
      {
        $unwind: '$client_doc'
      },
      {
        $project: {
          _id: '$client_doc._id',
          name: '$client_doc.name',
          brand: '$client_doc.brand',
          vatin: '$client_doc.vatin',
          minViews: '$minViews',
          maxViews: '$maxViews',
          startDate: '$startDate',
          endDate: '$endDate'
        }
      }
    ]
    return PageMeta
      .aggregate(pipeline)
      .exec()
  }

  getClientPagesID(client: number): any {
    return PageMeta.distinct('page', { client })
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
      page,
      minViews,
      maxViews,
      startDate,
      endDate
    }))
    return PageMeta.create(docs)
  }
}
