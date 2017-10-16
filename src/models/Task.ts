import * as mongoose from 'mongoose'

interface IData extends mongoose.Document {
}

const Data = new mongoose.Schema(
  {

  },
  {
    timestamps: true,
    minimize: true
  }
)

export const Task = mongoose.model<IData & mongoose.Document>('Task', Data)
