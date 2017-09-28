import axios from 'axios'

export const getTitle = async (url: string) => {
  const { data } = await axios.get(url)
  return data.match('<title>(.*?)</title>')[1]
}
