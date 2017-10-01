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
    const basicParams = {
      date1: yDate,
      date2: yDate,
      filters: `ym:s:startURL=='${url}'`,
      metrics: 'ym:s:pageviews,ym:s:pageDepth,ym:s:avgVisitDurationSeconds,ym:s:bounceRate'
    }
    const networks = {
      ...basicParams,
      dimensions: 'ym:s:UTMSource,ym:s:startURL'
    }
    const meta = {
      ...basicParams,
      dimensions: 'ym:s:<attribution>TrafficSource'
    }

    const { data: networksData } = await axios().get('', { params: networks })
    const { data: metaData } = await axios().get('', { params: meta })
    const { data: total } = await axios().get('', { params: basicParams })

    const date = Date.parse(networksData.query.date1)
    const data: any = {}

    const extractData = ([dataSource, fieldName]: [any, string]) =>
      dataSource.data.forEach((item: any) => {
        if (fieldName !== 'total') {
          const sourceName = item.dimensions[0][fieldName]
          if (metricSources.indexOf(sourceName) !== -1) {
            data[sourceName] = item.metrics
          }
        } else {
          data['total'] = item.metrics
        }
      })

    const sourcesData = [
      [networksData, 'name'],
      [metaData, 'id'],
      [total, 'total']
    ]

    sourcesData.forEach(extractData)

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
      { date: yDate, page: pageID, type: { $in: [...metricSources, 'total'] } },
      'pageviews pageDepth avgVisitDurationSeconds bounceRate type'
      )
      .lean()
      .exec()
  }
}
