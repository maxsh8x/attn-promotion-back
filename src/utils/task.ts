import { Container, Service } from 'typedi'
import { PageRepository } from '../repository/PageRepository'
import { MetricsRepository } from '../repository/MetricsRepository'

@Service()
class Task {
  constructor(
    private pageRepository: PageRepository,
    private metricsRepository: MetricsRepository
  ) {}

  async updateAllMetrics(job: any, done: any): Promise<void> {
    const urls = await this.pageRepository.getActivePagesURL()
    const items = []
    for (let i = 0; i < urls.length; i++) {
      const metricsData = await this.metricsRepository.getYMetrics(urls[i].url)
      items.push({
        ...metricsData,
        pageID: urls[i]._id
      })
    }
    try {
      await this.metricsRepository.createMetrics(items)
      done()
    } catch (e) {
      (e.code === 11000) ? done() : done(e)
    }
  }
}

export const task = Container.get(Task)
