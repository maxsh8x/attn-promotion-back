import axios from 'axios'
import { getAppConfig } from '../utils/config'

const config = getAppConfig()

const getInstance = () => axios.create({
  baseURL: config.apiURL,
  params: {
    oauth_token: config.tokenOAuth,
    pretty: false
  }
})

export default getInstance
