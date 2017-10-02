import * as mongoose from 'mongoose'
// TODO: fix old @types
const AutoIncrement = require('mongoose-sequence')(mongoose)

interface IData extends mongoose.Document {
  _id: number
  url: string
  title: string
}

const Data = new mongoose.Schema(
  {
    _id: Number,
    url: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    active: { type: Boolean, default: true }
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

export const Page = mongoose.model<IData & mongoose.Document>('Page', Data)
