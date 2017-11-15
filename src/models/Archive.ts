import * as mongoose from 'mongoose'
const mongooseLeanId = require('mongoose-lean-id')

export interface IData {
  _id: number
  page: number
  client: number
  minViews: number
  maxViews: number
  startDate: Date
  endDate: Date
}

export const Data = new mongoose.Schema(
  {
    _id: Number,
    page: { type: Number, ref: 'Page', required: true },
    client: { type: Number, ref: 'Client', required: true },
    minViews: { type: Number, required: true },
    maxViews: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    costPerClick: { type: Number, required: true }
  },
  {
    _id: false,
    timestamps: true
  }
)

Data.plugin(mongooseLeanId)

export const Archive = mongoose.model<IData & mongoose.Document>('Archive', Data)
