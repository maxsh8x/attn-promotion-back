import { metricFields, sources, CHART_INTERVAL_TYPE } from '../constants'
import * as moment from 'moment'

moment.updateLocale('en', {
  week: {
    dow: 1,
    doy: 1
  }
})

interface IGetCostPipelineParams {
  startDate: Date,
  endDate: Date,
  interval: CHART_INTERVAL_TYPE,
  pageID: number,
  byField: string,
  matchType: string,
}
export const totalByPage = (data: any) => {
  const metricsMap: any = {}
  for (let i = 0; i < data.length; i++) {
    metricsMap[data[i]._id] = data[i].value
  }
  return metricsMap
}

export const byMetric = (data: any[]) => {
  return metricFields.map((metric: any) => {
    const item: any = { metric, sources: {}, metagroups: {} }
    for (let i = 0; i < data.length; i++) {
      if (sources.indexOf(data[i]['type']) !== -1) {
        item['sources'][data[i]['type']] = data[i][metric]
      } else {
        item['metagroups'][data[i]['type']] = data[i][metric]
      }
    }
    return item
  })
}

const getIntervalGroupParams = (interval: CHART_INTERVAL_TYPE) => {
  switch (interval) {
    case 'days':
      return { primary: '$year', secondary: '$dayOfYear' }
    case 'months':
      return { primary: '$year', secondary: '$month' }
    default:
      throw new Error('Invalid interval')
  }
}

export const convertToDate = (
  primary: number,
  secondary: number,
  interval: CHART_INTERVAL_TYPE
) => {
  return moment(`${primary}`, 'YYYY')
    .add(secondary - 1, interval)
    .format('DD-MM-YYYY')
}

export const getCostPipeline = (params: IGetCostPipelineParams) => {
  const pipeline: any = [
    {
      $match: {
        page: params.pageID,
        date: {
          $gte: params.startDate,
          $lte: params.endDate
        },
        type: params.matchType
      }
    },
    {
      $project: {
        year: { $year: '$date' },
        month: { $month: '$date' },
        dayOfYear: { $dayOfYear: '$date' },
        value: `$${params.byField}`
      }
    },
    {
      $group: {
        _id: getIntervalGroupParams(params.interval),
        value: { $sum: '$value' }
      }
    },
    {
      $project: {
        _id: 0,
        primary: '$_id.primary',
        secondary: '$_id.secondary',
        value: 1
      }
    }
  ]
  return pipeline
}
