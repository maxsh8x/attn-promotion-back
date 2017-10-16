import { Service } from 'typedi'
import { Client } from '../models/Client'

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

  getAll(filter: string) {
    const query = filter
      ? { $text: { $search: filter } }
      : {}
    return Client
      .find(query, '_id name counterID')
      .lean()
      .exec()
  }

  search(filter: string, limit: number) {
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
