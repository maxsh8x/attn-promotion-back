import { Container, Service } from 'typedi'
import { PageRepository } from '../repository/PageRepository'
import { MetricsRepository } from '../repository/MetricsRepository'
import { ClientRepository } from '../repository/ClientRepository'

@Service()
class Task {
  constructor(
    private pageRepository: PageRepository,
    private metricsRepository: MetricsRepository,
    private clientRepository: ClientRepository
  ) { }

  async updateAllMetrics(job: any, done: any): Promise<void> {
    const activePages = await this.pageRepository.getActivePagesURL()
    const clientIDs = activePages.map((page: any) => page.client)
    const clients = await this.clientRepository.getTokens(clientIDs)
    const countersMap: any = {}
    for (let i = 0; i < clients.length; i += 1) {
      countersMap[clients[i]._id] = clients[i].counterID
    }
    const items = []
    for (let i = 0; i < activePages.length; i++) {
      const metricsData = await this.metricsRepository.getYMetrics(
        activePages[i].url,
        countersMap[activePages[i].client]
      )
      items.push({
        ...metricsData,
        pageID: activePages[i]._id
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
