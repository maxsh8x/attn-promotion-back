import * as mongoose from 'mongoose'
// TODO: fix old @types
const AutoIncrement = require('mongoose-sequence')(mongoose)

interface IData extends mongoose.Document {
  _id: number
  name: string
}

const Data = new mongoose.Schema(
  {
    _id: Number,
    name: { type: String, required: true }
  },
  {
    _id: false,
    timestamps: true,
    minimize: true
  }
)

Data.plugin(AutoIncrement, {
  id: 'client_seq'
})

Data.index({
  name: 'text'
})

export const Client = mongoose.model<IData & mongoose.Document>('Client', Data)
