import * as moment from 'moment'
import { Container, Service } from 'typedi'
import { PageRepository } from '../repository/PageRepository'
import { MetricsRepository } from '../repository/MetricsRepository'

@Service()
class Task {
  constructor(
    private pageRepository: PageRepository,
    private metricsRepository: MetricsRepository
  ) { }

  async updateAllMetrics(job: any, done: any): Promise<void> {
    const t0 = process.hrtime()
    let startDate = moment(job.attrs.lockedAt)
    const endDate = moment().add(-1, 'days')
    if (endDate > startDate) {
      startDate = endDate
    }
    const template = 'YYYY-MM-DD'
    const startDateString = startDate.format(template)
    const endDateString = startDate.format(template)
    const individualCounters = await this.pageRepository.getIndividualPageCounters()
    const groupCounters = await this.pageRepository.getGroupPageCounters()
    const pagesCounters = [...individualCounters, ...groupCounters]
    console.info(`Update started from ${startDateString} to ${endDateString}`)
    const data = []
    for (let i = 0; i < pagesCounters.length; i += 1) {
      try {
        const batchData = await this.metricsRepository.getYMetricsByDay(
          pagesCounters[i].url,
          pagesCounters[i]._id,
          pagesCounters[i].counterID,
          startDateString,
          endDateString
        )
        data.push(...batchData)
      } catch (e) {
        job.fail(`Failed to update page ${pagesCounters[i]._id}`)
      }
    }
    await this.metricsRepository.createMetrics(data)
    const t1 = process.hrtime(t0)
    console.info(`Update completed in ${t1[0]} secs.`)
    done()
  }
}

export const task = Container.get(Task)
