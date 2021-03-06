import { Service } from 'typedi'
import * as moment from 'moment'
import { Metrics } from '../models/Metrics'
import axios from '../utils/fetcher'
import { allSources } from '../constants'
import { CHART_INTERVAL_TYPE } from '../constants'
import { getCostPipeline } from '../utils/metrics'
import { PageRepository } from '../repository/PageRepository'
import { ClientRepository } from '../repository/ClientRepository'
import { Input } from '../models/Input';

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

interface IGetReportParams {
  startDate: Date,
  endDate: Date,
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

  async getPageData(pageID: number) {
    const pageData = await this.pageRepository.getOneWithClients(pageID)
    const { url, type } = pageData
    let counterID: number | null = null
    if (type === 'group') {
      counterID = pageData.counterID
    } else {
      if (type === 'individual' && pageData.meta.length > 0) {
        const clientData = await this.clientRepository.getOne(pageData.meta[0].client)
        counterID = clientData.counterID
      } else {
        return null
      }
    }
    return { url, counterID }
  }

  async getMetricsPeriodData(pageID: number, startDate: string, endDate: string) {
    const pageData = await this.getPageData(pageID)
    if (pageData === null) {
      return null
    }
    const { url, counterID } = pageData
    const data = await this.getYMetricsPeriod(
      url,
      counterID,
      startDate,
      endDate
    )
    return data
  }

  async updateMetrics(pageID: number, startDate: string, endDate: string) {
    const getYesterday = () => moment().add(-1, 'days').format('YYYY-MM-DD')
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    if (new Date(startDate) >= now) {
      startDate = getYesterday()
    }
    if (new Date(endDate) >= now) {
      endDate = getYesterday()
    }
    const { url, counterID } = await this.getPageData(pageID)
    const data = await this.getYMetricsByDay(url, pageID, counterID, startDate, endDate)
    if (data.length > 0) {
      await this.createMetrics(data)
    }
  }

  removeMetrics(page: number, startDate: Date, endDate: Date) {
    return Metrics.remove({
      page,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    })
  }

  async getYMetricsPeriod(startURLPath: string, counterID: number, startDate: string, endDate: string) {
    const basicParams = {
      ids: counterID,
      date1: startDate,
      date2: endDate,
      filters: `ym:s:startURLPath=='${startURLPath}'`,
      metrics: 'ym:s:pageviews,ym:s:pageDepth,ym:s:avgVisitDurationSeconds,ym:s:bounceRate'
    }
    const networks = {
      ...basicParams,
      dimensions: 'ym:s:UTMSource,ym:s:startURLPath'
    }
    const meta = {
      ...basicParams,
      dimensions: 'ym:s:<attribution>TrafficSource'
    }
    // TODO: 404 if counterID not found
    const { data: networksData } = await axios().get('', { params: networks })
    const { data: metaData } = await axios().get('', { params: meta })
    const { data: total } = await axios().get('', { params: basicParams })

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

    return data
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

  getReport(params: IGetReportParams) {
    const { startDate, endDate, pageID: page } = params
    const matchStageBase = {
      page,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }

    return Promise.all([
      Metrics.aggregate([
        { $match: { ...matchStageBase, type: 'total' } },
        {
          $project: {
            id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            views: '$pageviews'
          }
        }
      ]).exec(),
      Input.aggregate([
        { $match: matchStageBase },
        {
          $group: {
            _id: '$date',
            cost: { $sum: { $cond: [{ $eq: ['$type', 'cost'] }, '$value', 0] } },
            clicks: { $sum: { $cond: [{ $eq: ['$type', 'clicks'] }, '$value', 0] } }
          }
        },
        {
          $project: {
            id: { $dateToString: { format: '%Y-%m-%d', date: '$_id' } },
            cost: 1,
            clicks: 1
          }
        }
      ]).exec()
    ]).then(([metrics, inputs]) => {
      const resultMap = new Map()
      for (let i = 0; i < metrics.length; i++) {
        resultMap.set(metrics[i].id, {
          views: metrics[i].views
        })
      }
      for (let i = 0; i < inputs.length; i++) {
        if (resultMap.has(inputs[i].id)) {
          resultMap.set(inputs[i].id, {
            ...resultMap.get(inputs[i].id),
            cost: inputs[i].cost,
            clicks: inputs[i].clicks
          })
        } else {
          resultMap.set(inputs[i].id, {
            cost: inputs[i].cost,
            clicks: inputs[i].clicks
          })
        }
      }
      const result = []
      for (let item of resultMap) {
        result.push({
          id: item[0],
          ...item[1]
        })
      }
      result.sort(
        (a: any, b: any): any => +new Date(b.id) - +new Date(a.id)
      )
      return result
    })
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
