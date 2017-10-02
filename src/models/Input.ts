import * as mongoose from 'mongoose'

interface IData extends mongoose.Document {
  source: string
  type: string
  page: number
  date: Date
  value: number
}

const Data = new mongoose.Schema(
  {
    source: { type: String, required: true },
    type: { type: String, required: true },
    page: { type: Number, ref: 'Page', required: true },
    date: { type: Date, required: true },
    value: { type: Number, required: true }
  },
  {
    _id: false,
    timestamps: true,
    minimize: true
  }
)

Data.index(
  { source: 1, type: 1, page: 1, date: 1 },
  { unique: true }
)

export const Input = mongoose.model<IData & mongoose.Document>('Input', Data)
