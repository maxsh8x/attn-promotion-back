import { Service } from 'typedi'
import { Client } from '../models/Client'

interface IGetAll {
  limit: number
  offset: number
  filter: string
  clients: number[]
  role: string
}

interface ISearchFulltext {
  filter: string
  limit: number
  clients: number[]
  role: string
}

interface ISearchPattern {
  filter: string
  limit: number
  exclude: number[]
  clients: number[]
  role: string
}

@Service()
export class ClientRepository {
  create(params: any): any {
    return Client.create(params)
  }

  getTokens(clientID: number[]): any {
    return Client
      .find({
        _id: { $in: clientID }
      }, '_id counterID')
      .lean()
      .exec()
  }

  getOne(clientID: number): any {
    return Client
      .findById(clientID)
      .lean()
      .exec()
  }

  convertIDtoName(clientIDs: number[]): any {
    return Client
      .distinct('name', { _id: { $in: clientIDs } })
  }

  getAll(params: IGetAll): any {
    const { limit, offset, filter, clients, role } = params
    const query: any = {}
    if (filter) {
      query.$text = { $search: filter }
    }
    if (clients.length > 0 || role === 'manager') {
      query._id = { $in: clients }
    }
    return Promise.all([
      Client
        .find(query, '_id name counterID brand vatin')
        .skip(offset)
        .limit(limit)
        .lean()
        .exec(),
      Client
        .count(query)
    ])
  }



  searchFulltext(params: ISearchFulltext): any {
    const { filter, limit, role, clients } = params
    const query: any = filter
      ? { $text: { $search: filter } }
      : {}

    if (clients.length > 0 || role === 'manager') {
      query._id = { $in: clients }
    }

    return Client
      .find(query,
      {
        _id: 1,
        name: 1,
        brand: 1,
        score: { $meta: 'textScore' }
      })
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean()
      .exec()
  }

  searchPattern(params: ISearchPattern): any {
    const { filter, exclude, clients, limit, role } = params
    const query: any = {
      $and: [
        {
          $or: [
            { name: new RegExp(filter, 'i') },
            { brand: new RegExp(filter, 'i') }
          ]
        }
      ]
    }

    if (exclude.length > 0) {
      query.$and.push({ _id: { $nin: exclude } })
    }

    if (clients.length > 0 || role === 'manager') {
      query.$and.push({ _id: { $in: clients } })
    }

    return Client
      .find(query, '_id name brand')
      .limit(limit)
      .lean()
      .exec()
  }
}
