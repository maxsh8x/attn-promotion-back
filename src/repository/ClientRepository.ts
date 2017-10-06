import { Service } from 'typedi'
import { Client } from '../models/Client'

@Service()
export class ClientRepository {
  create(params: any): any {
    return Client.create(params)
  }

  getAll(offset: number, limit: number, filter: string) {
    const query = filter
    ? { $text: { $search: filter } }
    : {}
    return Client
      .find(query, '_id name')
      .skip(offset)
      .limit(limit)
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
