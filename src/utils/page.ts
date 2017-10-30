import axios from 'axios'
import * as urlLib from 'url'

export const getTitle = async (url: string) => {
  const { data } = await axios.get(url)
  return data.match('<title>(.*?)</title>')[1]
}

export const getStartURLPath = (startURL: string) => {
  return urlLib.parse(startURL).pathname
}
