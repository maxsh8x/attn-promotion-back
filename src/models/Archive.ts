import * as mongoose from 'mongoose'
import { QUESTION_VARIANT_ARRAY, QUESTION_VARIANT_TYPE } from '../constants'

export interface IData {
  page: number
  client: number
  minViews: number
  maxViews: number
  startDate: Date
  endDate: Date
  costPerClick: number
  archivedAt: Date
  type: QUESTION_VARIANT_TYPE
}

export const Data = new mongoose.Schema(
  {
    page: { type: Number, ref: 'Page', required: true },
    client: { type: Number, ref: 'Client', required: true },
    minViews: { type: Number, required: true },
    maxViews: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    costPerClick: { type: Number, required: true },
    archivedAt: { type: Date, default: Date.now },
    type: { type: String, required: true, enum: QUESTION_VARIANT_ARRAY }
  }
)

Data.virtual('pageData', {
  ref: 'Page',
  localField: 'page',
  foreignField: '_id',
  justOne: true
})

export const Archive = mongoose.model<IData & mongoose.Document>('Archive', Data)
