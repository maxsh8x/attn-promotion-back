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

export const byMetricDay = (data: any[]) => {
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

export const byMetricPeriod = (data: any) => {
  return metricFields.map((metric: any, i: number) => {
    const item: any = { metric, sources: {}, metagroups: {} }
    for (let prop in data) {
      if (sources.indexOf(prop) !== -1) {
        item['sources'][prop] = data[prop][i]
      } else {
        item['metagroups'][prop] = data[prop][i]
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

export const getClicksCostsProjections = (
  fieldStart: string,
  fieldEnd: string
) => ({
  inputCost: {
    $reduce: {
      input: {
        $filter: {
          input: '$inputs',
          as: 'item',
          cond: {
            $and: [
              { $gte: ['$$item.date', fieldStart] },
              { $lte: ['$$item.date', fieldEnd] },
              { $eq: ['$$item.type', 'cost'] }
            ]
          }
        }
      },
      initialValue: 0,
      in: { $add: ['$$value', '$$this.value'] }
    }
  },
  inputClicks: {
    $reduce: {
      input: {
        $filter: {
          input: '$inputs',
          as: 'item',
          cond: {
            $and: [
              { $gte: ['$$item.date', fieldStart] },
              { $lte: ['$$item.date', fieldEnd] },
              { $eq: ['$$item.type', 'clicks'] }
            ]
          }
        }
      },
      initialValue: 0,
      in: { $add: ['$$value', '$$this.value'] }
    }
  }
})

export const getViewsProjections = (
  startDate: Date,
  endDate: Date,
  fieldStart: string,
  fieldEnd: string
) => ({
  views: {
    $reduce: {
      input: {
        $filter: {
          input: '$metrics',
          as: 'item',
          cond: {
            $and: [
              { $gte: ['$$item.date', fieldStart] },
              { $lte: ['$$item.date', fieldEnd] }
            ]
          }
        }
      },
      initialValue: 0,
      in: { $add: ['$$value', '$$this.pageviews'] }
    }
  },
  viewsPeriod: {
    $reduce: {
      input: {
        $filter: {
          input: '$metrics',
          as: 'item',
          cond: {
            $and: [
              { $gte: ['$$item.date', startDate] },
              { $lte: ['$$item.date', endDate] }
            ]
          }
        }
      },
      initialValue: 0,
      in: { $add: ['$$value', '$$this.pageviews'] }
    }
  }
})

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
    },
    { $sort: { primary: 1, secondary: 1 } }
  ]
  return pipeline
}
