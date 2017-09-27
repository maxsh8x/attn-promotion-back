import 'reflect-metadata'
import * as mongoose from 'mongoose'
import * as bluebird from 'bluebird'
import { createKoaServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'
import { getAppConfig, validateConfig } from './utils/config'
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
  const koaApp = createKoaServer({
    controllers: [`${__dirname}/controllers/*.*`],
    authorizationChecker,
    currentUserChecker,
    routePrefix: '/api',
    validation: true,
    cors: true
  })

  koaApp.on('error', (err: Error) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(err)
    }
  })
  await mongoose.connect(config.mongoDB, {
    useMongoClient: true
  })
  koaApp.listen(config.port)
  console.info(`Server is up and running at port ${config.port}`)
})()
