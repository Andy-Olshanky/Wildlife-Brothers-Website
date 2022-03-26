import { UserToken } from './auth'
import { HTTPMethod } from './http'
import { PartialBy } from './types'

export const DEFAULT_METHOD = 'POST'
export const DEFAULT_AUTH_KEY = 'userToken'
export const DEFAULT_AUTH_REQUIRED = true

/**
 * A request to the server that requires authentication.
 */
export interface AuthRequest {
	userToken: UserToken
}

/**
 * A request to the server that requires optional authentication.
 */
export interface OptionalAuthRequest {
	userToken?: UserToken
}

export interface ProtocolOptions {
	/** The endpoint on the service where this function lives. */
	path: string
	/** The endpoint HTTP method. Defaults to POST. */
	method: HTTPMethod
	/** The key the cached data is written at. Defaults to "{path}". */
	cacheKey: string
	/** The keys in the request to ignore when caching. */
	cacheIgnoreProps: string[]
	/** The key to use for authentication. Defaults to "userToken". */
	authKey: string
	/** If true, returns an error if the authKey is invalid. Defaults to true. */
	authRequired: boolean
	/** The cache milliseconds on the client. */
	clientCacheMs?: number
	/** The cache milliseconds on the server. */
	serverCacheMs?: number
	/** Is the endpoint deprecated? */
	deprecated?: boolean
	/** The keys in the cache calling this method successfully invalidates. */
	invalidatesCacheKeys?: string[]
}

// A partial of ProtocolOptions to allow for default values.
interface InputProtocolProperties
	extends PartialBy<
		PartialBy<
			PartialBy<PartialBy<PartialBy<ProtocolOptions, 'method'>, 'cacheKey'>, 'cacheIgnoreProps'>,
			'authRequired'
		>,
		'authKey'
	> {
	/** If true, ignores the authKey when caching. */
	cacheIgnoreAuthKey?: boolean
}

// Default values for ProtocolOptions.
const DEFAULT_PROTOCOL_OPTIONS: Partial<ProtocolOptions> = {
	method: DEFAULT_METHOD,
	authKey: DEFAULT_AUTH_KEY,
	authRequired: DEFAULT_AUTH_REQUIRED,
	cacheIgnoreProps: [],
}

export interface ProtocolFunctionInterface<RequestType, ResponseType> {
	options: ProtocolOptions
	Request: RequestType
	Response: ResponseType
	Function: (_: RequestType) => Promise<ResponseType>
}

export class ProtocolFunction<RequestType, ResponseType>
	implements ProtocolFunctionInterface<RequestType, ResponseType>
{
	public options: ProtocolOptions

	constructor(options: InputProtocolProperties) {
		const cacheKey = options.cacheKey || options.path
		this.options = { ...DEFAULT_PROTOCOL_OPTIONS, cacheKey, ...options } as ProtocolOptions
		if (options.cacheIgnoreAuthKey) {
			this.options.cacheIgnoreProps.push(this.options.authKey)
		}
	}

	get Request(): RequestType {
		return {} as RequestType
	}

	get Response(): ResponseType {
		return {} as ResponseType
	}

	get Function(): (_: RequestType) => Promise<ResponseType> {
		return async (_: RequestType) => this.Response
	}
}

/**
 * A factory that creates a ProtocolFunction. Equivalent to `new ProtocolFunction<T, U>(...)`.
 * @param options The options for the ProtocolFunction.
 * @returns A built ProtocolFunction.
 */
export const Protocol = <RequestType, ResponseType>(options: InputProtocolProperties) => {
	return new ProtocolFunction<RequestType, ResponseType>(options)
}
