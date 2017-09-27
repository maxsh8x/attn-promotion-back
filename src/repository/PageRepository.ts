import { Service } from 'typedi'
import { Page } from '../models/Page'

// Add refresh tokens
@Service()
export class PageRepository {
  create(params: any) {
    return Page.create(params)
  }
}
