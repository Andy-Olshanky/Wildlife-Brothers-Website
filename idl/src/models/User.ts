import { Id } from '../common'

export interface User {
	id: UserId
	firstName: string
	lastName: string
	email: string
	profilePicture?: string
}

export type UserId = Id
