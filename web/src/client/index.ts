import { API_URL, Client } from '../util'

export const client = new Client(API_URL())

export * from './user'
