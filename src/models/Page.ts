import * as mongoose from 'mongoose'

interface IData extends mongoose.Document {
  url: string
  title: string
}

const Data = new mongoose.Schema(
  {
    url: { type: String, required: true },
    title: { type: String, required: true }
  },
  {
    timestamps: true,
    minimize: true
  }
)

export const Page = mongoose.model<IData & mongoose.Document>('Page', Data)
