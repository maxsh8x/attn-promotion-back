import * as mongoose from 'mongoose'
import {QUESTION_VARIANT_ARRAY, QUESTION_VARIANT_TYPE } from '../constants'
// TODO: fix old @types
const AutoIncrement = require('mongoose-sequence')(mongoose)

interface IData extends mongoose.Document {
  _id: number
  url: string
  title: string
  active: boolean
  parent: number
  type: QUESTION_VARIANT_TYPE
}

const Data = new mongoose.Schema(
  {
    _id: Number,
    url: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    active: { type: Boolean, default: true },
    parent: { type: Number, required: false },
    counterID: { type: Number, required: false },
    type: { type: String, required: true, enum: QUESTION_VARIANT_ARRAY }
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
