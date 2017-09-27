import axios from 'axios'
import { getAppConfig } from '../utils/config'

const config = getAppConfig()

const getInstance = () => axios.create({
  baseURL: config.apiURL,
  params: {
    ids: config.counterID,
    oauth_token: config.tokenOAuth
  }
})

export default getInstance
