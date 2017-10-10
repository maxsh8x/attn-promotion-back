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
  startDate: string,
  endDate: string,
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
