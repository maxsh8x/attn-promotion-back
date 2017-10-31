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

  search(filter: string, limit: number): any {
    const query = filter
      ? { $text: { $search: filter } }
      : {}
    return Client
      .find(query, '_id name')
      .limit(limit)
      .lean()
      .exec()
  }
}
