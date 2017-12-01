import { Service } from 'typedi'
import { Input } from '../models/Input'
import { CHART_INTERVAL_TYPE } from '../constants'
import { getCostPipeline } from '../utils/metrics'

interface IUpdateMetricsParams {
  source: string
  type: string
  pageID: number
  yDate: string
  value: number
}

interface IGetCostChartParams {
  startDate: Date,
  endDate: Date,
  interval: CHART_INTERVAL_TYPE,
  pageID: number
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

  getByPageIDs(pageIDs: number[], startDate: Date, endDate: Date): any {
    // TODO: $max
    const pipeline = [
      {
        $match: {
          date: {
            $gte: startDate,
            $lte: endDate
          },
          page: { $in: pageIDs }
        }
      },
      {
        $group: {
          _id: { page: '$page', source: '$source' },
          cost: { $sum: { $cond: [{ $eq: ['$type', 'cost'] }, '$value', 0] } },
          clicks: { $sum: { $cond: [{ $eq: ['$type', 'clicks'] }, '$value', 0] } }
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

  getCostChart(params: IGetCostChartParams) {
    const { startDate, endDate, interval, pageID } = params
    const pipeline = getCostPipeline({
      startDate,
      endDate,
      interval,
      pageID,
      byField: 'value',
      matchType: 'cost'
    })

    return Input
      .aggregate(pipeline)
      .exec()
  }
}
