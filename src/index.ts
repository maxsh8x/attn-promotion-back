import 'reflect-metadata'
import * as mongoose from 'mongoose'
import * as bluebird from 'bluebird'
import * as Agenda from 'agenda'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'
import { getAppConfig, validateConfig } from './utils/config'
import { task } from './utils/task'
import { authorizationChecker, currentUserChecker } from './utils/middlewares'

(mongoose as any).Promise = bluebird
global.Promise = bluebird

useContainer(Container);

(async () => {
  const isConfigValid = await validateConfig()
  if (!isConfigValid) {
    console.error('Invalid app config schema')
    process.exit(1)
  }
  const config = getAppConfig()
  // TODO: declare controllers manual
  const expressApp = createExpressServer({
    controllers: [`${__dirname}/controllers/*.*`],
    authorizationChecker,
    currentUserChecker,
    routePrefix: '/api',
    validation: true,
    cors: true
  })

  expressApp.on('error', (err: Error) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(err)
    }
  })
  expressApp.set('etag', false)

  await mongoose.connect(config.mongoDB, {
    useMongoClient: true
  })

  // const agenda = new Agenda({ db: { address: config.agendaMongoDB } })
  // agenda.define('update metrics', (job, done) => {
  //   task.updateAllMetrics(job, done)
  // })

  // agenda.on('ready', () => {
  //   agenda.every('0 8 * * *', 'update metrics')
  //   agenda.start()
  // })

  expressApp.listen(config.port)
  console.info(`Server is up and running at port ${config.port}`)
})()
