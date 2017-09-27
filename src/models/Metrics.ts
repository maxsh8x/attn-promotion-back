import * as mongoose from 'mongoose'

interface IData extends mongoose.Document {
  name: string
  page: Object
  pageviews: number
  pageDepth: number
  avgVisitDurationSeconds: number
  bounceRate: number
}

const Data = new mongoose.Schema(
  {
    type: { type: String, required: true },
    page: { type: mongoose.Schema.Types.ObjectId, ref: 'Page', required: true },
    pageviews: { type: Number, required: true },
    pageDepth: { type: Number, required: true },
    avgVisitDurationSeconds: { type: Number, required: true },
    bounceRate: { type: Number, required: true },
    date: { type: Date, required: true }
  },
  {
    timestamps: true,
    minimize: true
  }
)

export const Metrics = mongoose.model<IData & mongoose.Document>('Metrics', Data)
