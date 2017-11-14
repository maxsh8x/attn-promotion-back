import * as mongoose from 'mongoose'
import {QUESTION_VARIANT_ARRAY, QUESTION_VARIANT_TYPE } from '../constants'
// TODO: fix old @types
const AutoIncrement = require('mongoose-sequence')(mongoose)

interface Meta {
  client: number
  minViews: number
  maxViews: number
  startDate: Date
  endDate: Date
}

export interface IData extends mongoose.Document {
  _id: number
  url: string
  title: string
  active: boolean
  type: QUESTION_VARIANT_TYPE
  meta: Meta[]
}

const Meta = new mongoose.Schema(
  {
    _id: Number,
    client: { type: Number, ref: 'Client', required: true },
    minViews: { type: Number, required: true },
    maxViews: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    costPerClick: { type: Number, required: true }
  },
  {
    _id: false
  }
)

const Data = new mongoose.Schema(
  {
    _id: Number,
    url: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    active: { type: Boolean, default: true },
    counterID: { type: Number, required: false },
    type: { type: String, required: true, enum: QUESTION_VARIANT_ARRAY },
    meta: [Meta]
  },
  {
    _id: false,
    timestamps: true,
    minimize: true
  }
)

Data.plugin(AutoIncrement, {
  id: 'page_seq'
})

Data.virtual('input', {
  ref: 'Input',
  localField: '_id',
  foreignField: 'page',
  justOne: false
})

Data.index({
  title: 'text',
  url: 'text'
})

export const Page = mongoose.model<IData & mongoose.Document>('Page', Data)
