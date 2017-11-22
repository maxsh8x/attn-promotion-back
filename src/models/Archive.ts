import * as mongoose from 'mongoose'

export interface IData {
  page: number
  client: number
  minViews: number
  maxViews: number
  startDate: Date
  endDate: Date
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
    archivedAt: { type: Date, default: Date.now }
  }
)

Data.virtual('pageData', {
  ref: 'Page',
  localField: 'page',
  foreignField: '_id',
  justOne: true
})

export const Archive = mongoose.model<IData & mongoose.Document>('Archive', Data)
