import * as mongoose from 'mongoose'
// TODO: fix old @types
const AutoIncrement = require('mongoose-sequence')(mongoose)

interface IData extends mongoose.Document {
  _id: number
  type: string
  page: number
  pageviews: number
  pageDepth: number
  avgVisitDurationSeconds: number
  bounceRate: number
  date: Date
}

const Data = new mongoose.Schema(
  {
    _id: Number,
    type: { type: String, required: true },
    page: { type: Number, ref: 'Page', required: true },
    pageviews: { type: Number, required: true },
    pageDepth: { type: Number, required: true },
    avgVisitDurationSeconds: { type: Number, required: true },
    bounceRate: { type: Number, required: true },
    date: { type: Date, required: true }
  },
  {
    _id: false,
    timestamps: true,
    minimize: true
  }
)

Data.plugin(AutoIncrement, {
  id: 'metrics_seq'
})

Data.index(
  { 'type': 1, 'page': 1, 'date': 1 },
  { unique: true }
)

export const Metrics = mongoose.model<IData & mongoose.Document>('Metrics', Data)
