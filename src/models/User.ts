import * as mongoose from 'mongoose'
import { ROLES_ARRAY, ROLES_TYPE } from '../constants'

// TODO: fix old @types
const AutoIncrement = require('mongoose-sequence')(mongoose)

interface IData extends mongoose.Document {
  _id: number
  username: string
  hash: string
  salt: string
  iterations: number
  active: boolean
  balance: number
  email: string
  role: ROLES_TYPE
}

const Data = new mongoose.Schema(
  {
    _id: Number,
    username: { type: String, required: true, unique: true },
    hash: { type: String, required: true },
    salt: { type: String, required: true },
    iterations: { type: Number, required: true },
    active: { type: Boolean, required: true },
    balance: { type: Number, default: 0 },
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true, enum: ROLES_ARRAY }
  },
  {
    _id: false,
    timestamps: true,
    minimize: true
  }
)

Data.plugin(AutoIncrement, {
  id: 'user_seq'
})

export const User = mongoose.model<IData & mongoose.Document>('User', Data)
