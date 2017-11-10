import { Service } from 'typedi'
import { Metrics } from '../models/Metrics'
import axios from '../utils/fetcher'
import { allSources } from '../constants'
import { CHART_INTERVAL_TYPE } from '../constants'
import { getCostPipeline } from '../utils/metrics'
import { PageRepository } from '../repository/PageRepository'
import { ClientRepository } from '../repository/ClientRepository'

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

interface IGetYMetrics {
  startURLPath: string,
  counterID: number
  startDate: Date
  endDate: Date
}

@Service()
export class MetricsRepository {
  constructor(
    private pageRepository: PageRepository,
    private clientRepository: ClientRepository
  ) { }

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

  async updateMetrics(pageID: number, startDate: string, endDate: string) {
    const pageData = await this.pageRepository.getOne(pageID)
    console.log('page_date', pageData)
    const { url, type } = pageData
    let counterID: number | null = null
    if (type === 'group') {
      counterID = pageData.counterID
    } else {
      const clientData = await this.clientRepository.getOne(pageData.meta[0].client)
      counterID = clientData.counterID
    }
    const data = await this.getYMetricsByDay(url, pageID, counterID, startDate, endDate)
    console.log('lol', data)
    if (data.length > 0) {
      await this.createMetrics(data)
    }
  }

  async getYMetricsByDay(
    startURLPath: string,
    page: number,
    counterID: number,
    startDate: string,
    endDate: string
  ) {
    const basicParams = {
      ids: counterID,
      date1: startDate,
      date2: endDate,
      filters: `ym:s:startURLPath=='${startURLPath}'`,
      metrics: 'ym:s:pageviews,ym:s:pageDepth,ym:s:avgVisitDurationSeconds,ym:s:bounceRate',
      dimensions: 'ym:s:datePeriod<group>Name',
      group: 'day'
    }

    const networks = {
      ...basicParams,
      dimensions: [
        'ym:s:UTMSource',
        'ym:s:startURLPath',
        basicParams.dimensions
      ].join(',')
    }

    const meta = {
      ...basicParams,
      dimensions: [
        'ym:s:<attribution>TrafficSource',
        basicParams.dimensions
      ].join(',')
    }

    const { data: networksData } = await axios().get('', {
      params: networks
    })
    const { data: metaData } = await axios().get('', { params: meta })
    const { data: total } = await axios().get('', { params: basicParams })

    const result: any = []

    const extractData = (
      [dataSource, datePosition, fieldName, fieldPosition]: [
        any,
        number,
        string,
        number | null
      ]
    ) => {
      for (let i = 0; i < dataSource.data.length; i += 1) {
        const type = fieldName !== 'total'
          ? dataSource.data[i].dimensions[fieldPosition][fieldName]
          : fieldName
        if (fieldName !== 'total' && allSources.indexOf(type) === -1) {
          continue
        }
        result.push({
          date: dataSource.data[i].dimensions[datePosition].name,
          avgVisitDurationSeconds: dataSource.data[i].metrics[2],
          bounceRate: dataSource.data[i].metrics[3],
          pageDepth: dataSource.data[i].metrics[1],
          pageviews: dataSource.data[i].metrics[0],
          type,
          page
        })
      }
    }

    const sourcesData = [
      [networksData, 2, 'name', 0],
      [metaData, 1, 'id', 0],
      [total, 0, 'total', null]
    ]

    sourcesData.forEach(extractData)
    return result
  }

  createMetrics(items: any[]): any {
    return (Metrics as any).bulkWrite(items.map(item => ({
      replaceOne: {
        filter: { type: item.type, page: item.page, date: item.date },
        replacement: item,
        upsert: true
      }
    })))
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
          type: 'total'
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
      matchType: 'total'
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
          type: 'total'
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
