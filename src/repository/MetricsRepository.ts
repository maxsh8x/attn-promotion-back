import { Service } from 'typedi'
import { Metrics } from '../models/Metrics'
import axios from '../utils/fetcher'
import { metricSources } from '../constants'

export class DataItem {
  [name: string]: Array<number>
}

export class CreateMetricsParams {
  date: Date
  data: DataItem
}


@Service()
export class MetricsRepository {
  async getYMetrics(url: string, yDate = 'yesterday') {
    const response = await axios().get('', {
      params: {
        date1: yDate,
        date2: yDate,
        pretty: false,
        metrics: 'ym:s:pageviews,ym:s:pageDepth,ym:s:avgVisitDurationSeconds,ym:s:bounceRate',
        dimensions: 'ym:s:UTMSource,ym:s:startURL',
        filters: `ym:s:startURL=='${url}'`
      }
    })
    const date = Date.parse(response.data.query.date1)
    const data: any = {}
    response.data.data.forEach((item: any) => {
      const sourceName = item.dimensions[0].name
      if (metricSources.indexOf(sourceName) !== -1) {
        data[sourceName] = item.metrics
      }
    })
    return { date, data }
  }

  createMetrics(params: any): any {
    const items = Object.keys(params.data).map(type => {
      const [
        pageviews,
        pageDepth,
        avgVisitDurationSeconds,
        bounceRate
      ] = params.data[type]
      return {
        date: params.date,
        page: params.pageID,
        pageviews,
        pageDepth,
        avgVisitDurationSeconds,
        bounceRate,
        type
      }
    })
    return Metrics.create(items)
  }

  getMetrics(yDate: string, pageID: number): any {
    return Metrics
      .find(
      { date: yDate, page: pageID, type: { $in: metricSources } },
      'pageviews pageDepth avgVisitDurationSeconds bounceRate type'
      )
      .lean()
      .exec()
  }
}
