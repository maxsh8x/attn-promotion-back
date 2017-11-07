import { Service } from 'typedi'
import { Client } from '../models/Client'

interface IGetAll {
  limit: number
  offset: number
  filter: string
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

  searchFulltext(filter: string, limit: number): any {
    // name:{'$regex' : '^string$', '$options' : 'i'}}
    const query = filter
      ? { $text: { $search: filter } }
      : {}
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

  searchPattern(filter: string, limit: number, exclude: number[]): any {
    const query: any = filter
      ? {
        $or: [
          { name: new RegExp(filter, 'i') },
          { brand: new RegExp(filter, 'i') }
        ]
      }
      : {}
    if (exclude.length > 0) {
      query._id = { $nin: exclude }
    }
    return Client
      .find(query, '_id name brand')
      .limit(limit)
      .lean()
      .exec()
  }
}
