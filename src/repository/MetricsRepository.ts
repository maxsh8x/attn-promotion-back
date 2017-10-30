import { Service } from 'typedi'
import { Metrics } from '../models/Metrics'
import axios from '../utils/fetcher'
import { allSources } from '../constants'
import { CHART_INTERVAL_TYPE } from '../constants'
import { getCostPipeline } from '../utils/metrics'

export class DataItem {
  [name: string]: Array<number>
}

export class CreateMetricsParams {
  date: Date
  data: DataItem
}

interface IGetCostChartParams {
  startDate: Date,
  endDate: Date,
  interval: CHART_INTERVAL_TYPE,
  pageID: number
}

@Service()
export class MetricsRepository {
  async isValidCounterID(counterID: number) {
    try {
      await axios().get('', {
        params: {
          ids: counterID,
          preset: 'sources_summary'
        }
      })
      return true
    } catch (e) {
      return false
    }
  }

  async getYMetrics(url: string, counterID: number, yDate = 'yesterday') {
    const basicParams = {
      ids: counterID,
      date1: yDate,
      date2: yDate,
      metrics: 'ym:s:pageviews,ym:s:pageDepth,ym:s:avgVisitDurationSeconds,ym:s:bounceRate'
    }
    const networks = {
      ...basicParams,
      filters: `ym:s:startURL=='${url}'`,
      dimensions: 'ym:s:UTMSource,ym:s:startURL'
    }
    const meta = {
      ...basicParams,
      filters: `ym:s:startURL=='${url}'`,
      dimensions: 'ym:s:<attribution>TrafficSource'
    }
    // TODO: 404 if counterID not found
    const { data: networksData } = await axios().get('', { params: networks })
    const { data: metaData } = await axios().get('', { params: meta })
    const { data: total } = await axios().get('', { params: basicParams })

    const date = Date.parse(networksData.query.date1)
    const data: any = {}

    const extractData = ([dataSource, fieldName]: [any, string]) =>
      dataSource.data.forEach((item: any) => {
        if (fieldName !== 'total') {
          const sourceName = item.dimensions[0][fieldName]
          if (allSources.indexOf(sourceName) !== -1) {
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

  createMetrics(items: any[]): any {
    const docs = []
    for (let i = 0; i < items.length; i++) {
      const keys = Object.keys(items[i].data)
      for (let x = 0; x < keys.length; x++) {
        const sourceMetrics = items[i].data[keys[x]]
        docs.push({
          date: items[i].date,
          page: items[i].pageID,
          pageviews: sourceMetrics[0],
          pageDepth: sourceMetrics[1],
          avgVisitDurationSeconds: sourceMetrics[2],
          bounceRate: sourceMetrics[3],
          type: keys[x]
        })
      }
    }
    return Metrics.insertMany(docs, { ordered: false })
  }

  getMetrics(yDate: string, pageID: number): any {
    return Metrics
      .find(
      { date: yDate, page: pageID, type: { $in: [...allSources, 'total'] } },
      'pageviews pageDepth avgVisitDurationSeconds bounceRate type'
      )
      .lean()
      .exec()
  }

  lineChart(startDate: Date, endDate: Date, pages: number[]) {
    const pipeline = [
      {
        $match: {
          page: { $in: pages },
          date: {
            $gte: startDate,
            $lte: endDate
          },
          type: 'ad'
        }
      },
      {
        $lookup: {
          from: 'pages',
          localField: 'page',
          foreignField: '_id',
          as: 'page_doc'
        }
      },
      {
        $group: {
          _id: {
            page: '$page',
            date: '$date'
          },
          label: { $first: '$page_doc.title' },
          data: {
            $push: {
              x: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
              y: '$pageviews'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          label: { $arrayElemAt: ['$label', 0] },
          data: 1
        }
      }
    ]
    return Metrics
      .aggregate(pipeline)
      .exec()
  }

  getCostChart(params: IGetCostChartParams) {
    const { startDate, endDate, interval, pageID } = params
    const pipeline = getCostPipeline({
      startDate,
      endDate,
      interval,
      pageID,
      byField: 'pageviews',
      matchType: 'ad'
    })
    return Metrics
      .aggregate(pipeline)
      .exec()
  }

  getTotalByPage(startDate: Date, endDate: Date, pages: number[]) {
    const pipeline = [
      {
        $match: {
          page: { $in: pages },
          date: {
            $gte: startDate,
            $lte: endDate
          },
          type: 'ad'
        }
      },
      {
        $group: {
          _id: '$page',
          value: { $sum: '$pageviews' }
        }
      }
    ]
    return Metrics
      .aggregate(pipeline)
      .exec()
  }
}
