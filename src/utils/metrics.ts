import { metricFields } from '../constants'

export const byMetric = (data: any[]) => {
  return metricFields.map((metric: any) => {
    const item: any = { metric }
    for (let i = 0; i < data.length; i++) {
      item[data[i]['type']] = data[i][metric]
    }
    return item
  })
}
