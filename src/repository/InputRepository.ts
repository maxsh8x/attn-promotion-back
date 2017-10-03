import { Service } from 'typedi'
import { Input } from '../models/Input'

interface IUpdateMetricsParams {
  source: string
  type: string
  pageID: number
  yDate: string
  value: number
}

@Service()
export class InputRepository {
  getByPageDate(yDate: string, pageID: number): any {
    return Input.find({
      date: yDate,
      page: pageID
    }, '-_id source type value')
      .lean()
      .exec()
  }

  getByPageIDs(pageIDs: number[], yDate: string): any {
    const date = new Date(yDate)
    const pipeline = [
      { $match: { date, page: { $in: pageIDs } } },
      {
        $group: {
          _id: { page: '$page', source: '$source' },
          cost: { $max: { $cond: [{ $eq: ['$type', 'cost'] }, '$value', 0] } },
          clicks: { $max: { $cond: [{ $eq: ['$type', 'clicks'] }, '$value', 0] } }
        }
      },
      {
        $group: {
          _id: { page: '$_id.page' },
          sources: { $push: '$_id.source' },
          cost: { $push: '$cost' },
          clicks: { $push: '$clicks' }
        }
      }
    ]
    return Input
      .aggregate(pipeline)
      .exec()
  }

  update(params: IUpdateMetricsParams): any {
    const {
      source,
      type,
      pageID: page,
      yDate: date,
      value
    } = params
    const query = {
      source,
      type,
      page,
      date
    }
    return Input.update(
      query,
      {
        ...query,
        date,
        value
      },
      { upsert: true }
    )
      .lean()
      .exec()
  }
}
