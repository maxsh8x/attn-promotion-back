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
  role: ROLES_TYPE
  name: string
  email: string
  clients: number[]
}

const Data = new mongoose.Schema(
  {
    _id: Number,
    username: { type: String, required: true, unique: true },
    hash: { type: String, required: true },
    salt: { type: String, required: true },
    iterations: { type: Number, required: true },
    active: { type: Boolean, required: true },
    role: { type: String, required: true, enum: ROLES_ARRAY },
    name: { type: String, required: true },
    email: { type: String, required: true },
    clients: [{ type: Number, ref: 'Client', required: true }]
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
