export const bySource = (data: any[]) => {
  const result: any = {}
  data.forEach(item => {
    if (!(item.source in result)) {
      result[item.source] = {}
    }
    result[item.source][item.type] = item.value
  })
  return result
}
