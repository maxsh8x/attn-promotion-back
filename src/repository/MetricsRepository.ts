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

  createMetrics(items: any[]): any {
    // const bulk = Metrics.collection.initializeUnorderedBulkOp()
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
      { date: yDate, page: pageID, type: { $in: [...metricSources, 'total'] } },
      'pageviews pageDepth avgVisitDurationSeconds bounceRate type'
      )
      .lean()
      .exec()
  }

  lineChart(startDate: string, endDate: string, pages: number[]) {
    const pipeline = [
      {
        $match: {
          page: { $in: pages },
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
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
}
