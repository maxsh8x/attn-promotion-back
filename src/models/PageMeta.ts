import * as mongoose from 'mongoose'
// TODO: fix old @types
const AutoIncrement = require('mongoose-sequence')(mongoose)

interface IData extends mongoose.Document {
  _id: number
  client: number
  page: number
  minViews: number
  maxViews: number
  startDate: Date
  endDate: Date
  archieved: boolean,
}

const Data = new mongoose.Schema(
  {
    _id: Number,
    client: { type: Number, required: true },
    page: { type: Number, required: true },
    minViews: { type: Number, required: true },
    maxViews: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    archieved: {type: Boolean, default: false}
  },
  {
    _id: false,
    timestamps: true,
    minimize: true
  }
)

Data.plugin(AutoIncrement, {
  id: 'pagemeta_seq'
})

export const PageMeta = mongoose.model<IData & mongoose.Document>('PageMeta', Data)
