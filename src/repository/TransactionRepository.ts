import { Service } from 'typedi'
import { Transaction } from '../models/Transaction'
// import {
//   TRANSACTION_STATES_TYPE
// } from '../constants'

interface IInitTransactionParams {
  srcID: number
  destID: number
  srcCol: string
  destCol: string
  type: string
  docs: any[]
}

@Service()
export class TransactionRepository {
  initialize(params: IInitTransactionParams): any {
    const {
      srcID,
      destID,
      srcCol,
      destCol,
      type,
      docs
    } = params
    return Transaction
      .create({
        srcID,
        destID,
        srcCol,
        destCol,
        type,
        docs
      })
  }
}
