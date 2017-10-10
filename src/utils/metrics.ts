import { metricFields, CHART_INTERVAL_TYPE } from '../constants'
import * as moment from 'moment'

interface IGetCostPipelineParams {
  startDate: string,
  endDate: string,
  interval: CHART_INTERVAL_TYPE,
  pageID: number,
  byField: string,
  matchType: string,
}

export const byMetric = (data: any[]) => {
  return metricFields.map((metric: any) => {
    const item: any = { metric }
    for (let i = 0; i < data.length; i++) {
      item[data[i]['type']] = data[i][metric]
    }
    return item
  })
}

const getIntervalGroupParams = (interval: CHART_INTERVAL_TYPE) => {
  switch (interval) {
    case 'days':
      return { primary: '$year', secondary: '$dayOfYear' }
    case 'weeks':
      return { primary: '$year', secondary: '$isoWeek' }
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
  return moment(`${primary}`)
    .add(secondary, interval)
    .format('DD-MM-YYYY')
}

export const getCostPipeline = (params: IGetCostPipelineParams) => {
  const pipeline: any = [
    {
      $match: {
        page: params.pageID,
        date: {
          $gte: new Date(params.startDate),
          $lte: new Date(params.endDate)
        },
        type: params.matchType
      }
    },
    {
      $project: {
        year: { $year: '$date' },
        month: { $month: '$date' },
        isoWeek: { $isoWeek: '$date' },
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
