import * as moment from 'moment'
import { log } from 'util'
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
    let startDate = moment(job.attrs.lastFinishedAt)
    const yesteday = moment().add(-1, 'days')
    if (startDate > yesteday) {
      startDate = yesteday
    }
    const template = 'YYYY-MM-DD'
    const startDateString = startDate.format(template)
    const endDateString = yesteday.format(template)
    const individualCounters = await this.pageRepository.getIndividualPageCounters()
    const groupCounters = await this.pageRepository.getGroupPageCounters()
    const pagesCounters = [...individualCounters, ...groupCounters]
    log(`Update started from ${startDateString}`)
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
    if (data.length > 0) {
      await this.metricsRepository.createMetrics(data)
    }
    const t1 = process.hrtime(t0)
    log(`Update ${pagesCounters.length} pages completed in ${t1[0]} secs.`)
    done()
  }
}

export const task = Container.get(Task)
