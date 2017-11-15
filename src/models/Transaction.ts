import { Document, Schema, model } from 'mongoose'
import {
  TRANSACTION_STATES_ARRAY,
  TRANSACTION_STATES_TYPE
} from '../constants'


interface IData extends Document {
  srcID: number
  dest: number
  srcCol: string
  destCol: string
  type: string
  docs: any[]
  state: TRANSACTION_STATES_TYPE
}

const Data = new Schema(
  {
    srcID: { type: Number, required: true },
    destID: { type: Number, required: true },
    srcCol: { type: String, required: true },
    destCol: { type: String, required: true },
    type: { type: String, required: true },
    docs: [{ type: Schema.Types.Mixed, required: true }],
    state: { type: String, required: true, enum: TRANSACTION_STATES_ARRAY }
  },
  {
    _id: false,
    timestamps: true,
    minimize: true
  }
)

export const Transaction = model<IData & Document>('Transaction', Data)
