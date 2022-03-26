import { UserToken } from '../../../idl'
import { Route as GenericRoute } from '../util'

// Metadata provided to each function via the auth middleware
export interface FunctionMetadata {
	userToken?: UserToken
}

export class Route extends GenericRoute<FunctionMetadata> {
	constructor() {
		super()
	}
}
