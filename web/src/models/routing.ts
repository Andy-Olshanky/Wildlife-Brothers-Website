import { ReactElement } from "react"

export type AuthRequired = 'LOGGED_IN' | 'NOT_LOGGED_IN' | 'BOTH'

export interface Route {
	name: string
	path: string
	page: () => ReactElement
	auth: AuthRequired
	exact?: boolean
}
