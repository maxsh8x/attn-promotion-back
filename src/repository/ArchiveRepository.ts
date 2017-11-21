import { Service } from 'typedi'
import { Archive } from '../models/Archive'

@Service()
export class ArchiveRepository {
  getArchive(page: number, client: number) {
    return Archive
      .find({ page, client }, 'minViews maxViews startDate endDate costPerClick')
      .lean()
      .exec()
      .then((docs: any) => {
        for (let i = 0; i < docs.length; i++) {
          docs[i].id = docs[i]._id.toString()
          delete docs[i]._id
        }
        return docs
      })
  }
  
  getLatest(): any {
    return Archive
    .find()
    .lean()
    .exec()
  }

  getHistorical(): any {
    return Archive
    .find()
    .lean()
    .exec()
  }
}
