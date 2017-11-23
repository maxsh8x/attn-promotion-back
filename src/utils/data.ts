export function transformObjectID(docs: any, fieldName: string) {
  for (let i = 0; i < docs.length; i++) {
    docs[i][fieldName] = docs[i][fieldName].toString()
  }
  return docs
}
