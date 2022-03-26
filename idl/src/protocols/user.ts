import { OptionalAuthRequest, Protocol } from '../common'
import { User, UserId } from '../models'

/**
 * GetUserById
 */

export interface GetUserByIdRequest extends OptionalAuthRequest {
	id: UserId
}
export type GetUserByIdResponse = User
export const GetUserById = Protocol<GetUserByIdRequest, GetUserByIdResponse>({
	path: '/user/getUserById',
	serverCacheMs: 15000,
	clientCacheMs: 300000,
	authRequired: false,
})
