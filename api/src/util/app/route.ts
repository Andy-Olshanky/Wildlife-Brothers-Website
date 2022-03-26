import express from 'express'
import NodeCache from 'node-cache'
import { ProtocolFunctionInterface } from '../../../../idl'
import { copyWithKeysDeleted } from '../helpers'
import { ExpressRequest, ExpressResponse } from './express'
import { AuthMiddlewareFunction, PostRequestMiddlewareFunction, PreRequestMiddlewareFunction } from './middleware'
import { Response, ResponseBody } from './response'

export type FunctionCallback<RequestType, ResponseType, MetadataType> = (
	req: RequestType,
	res: Response<RequestType, ResponseType>,
	data: MetadataType,
) => Promise<void>

export type CachedResponses = { [requestKey: string]: CachedResponse }
export type CachedResponse = {
	code: number
	body?: ResponseBody
}

export interface RouteOptions {
	cacheTtl: number
	cacheCheckPeriod: number
}

export class Route<MetadataType = void> {
	private router: express.Router
	private cache: NodeCache

	private preRequestMiddleware = [] as PreRequestMiddlewareFunction[]
	private postRequestMiddleware = [] as PostRequestMiddlewareFunction[]
	private authMiddleware = [] as AuthMiddlewareFunction[]

	constructor(options?: RouteOptions) {
		this.router = express.Router()
		this.cache = new NodeCache({
			stdTTL: options?.cacheTtl || 60,
			checkperiod: options?.cacheTtl || 120,
		})
	}

	get expressRouter() {
		return this.router
	}

	public function = <RequestType, ResponseType>(
		protocol: ProtocolFunctionInterface<RequestType, ResponseType>,
		callback: FunctionCallback<RequestType, ResponseType, MetadataType>,
	) => {
		const options = protocol.options
		if (options.path[0] !== '/') {
			throw Error('Protocol path must start with a slash')
		}

		// Get the Express routing function dynamically
		;(this.router as any)[options.method.toLowerCase()](
			options.path,
			async (req: ExpressRequest, res: ExpressResponse) => {
				const startTimestamp = Date.now()

				const body = (options.method === 'GET' ? req.params : req.body) as RequestType

				const requestKey = this.getRequestKey(req, options.cacheIgnoreProps)

				const onResponse = (code: number, body?: ResponseBody) => {
					if (options.serverCacheMs) {
						const requestCache = this.cache.get<CachedResponses>(options.cacheKey) || {}
						requestCache[requestKey] = {
							code,
							body,
						}
						this.cache.set(options.cacheKey, requestCache, options.serverCacheMs)
					}
					if (options.invalidatesCacheKeys) {
						this.cache.del(options.invalidatesCacheKeys)
					}
				}

				const response = new Response<RequestType, ResponseType>(body, res, onResponse)

				// Apply pre-request middleware
				for (const preRequestMiddleware of this.preRequestMiddleware) {
					await preRequestMiddleware(req, response)
					if (response.isLocked) {
						return
					}
				}

				try {
					let metadata = {} as any

					/**
					 * Attempt to fetch response from cache.
					 */
					const requestCache = this.cache.get<CachedResponses>(options.cacheKey) || {}
					if (requestCache.hasOwnProperty(requestKey)) {
						const cached = requestCache[requestKey]
						return response.sendResponse(cached.code, cached.body, false)
					}

					/**
					 * Perform auth pre-check
					 */
					for (const authMiddleware of this.authMiddleware) {
						const authMetadata = await authMiddleware(req, response, options.authRequired)
						if (response.isLocked) {
							break
						}
						if (authMetadata) {
							metadata = { ...metadata, ...authMetadata }
						}
					}

					// Run the function if no response has been sent yet
					if (!response.isLocked) {
						try {
							await callback(body, response, metadata)
						} catch (e) {
							console.error(e)
							return response.internalServerError('Function error')
						}
					}

					const endTimestamp = Date.now()

					// Apply post-request middleware
					for (const postRequestMiddleware of this.postRequestMiddleware) {
						await postRequestMiddleware(req, response, startTimestamp, endTimestamp)
					}
				} catch (e) {
					console.error(e)
					return response.internalServerError('Endpoint error')
				}
			},
		)
	}

	public setAuthMiddleware = (...middleware: AuthMiddlewareFunction[]) => {
		this.authMiddleware = middleware
	}

	public setPreRequestMiddleware = (...middleware: PreRequestMiddlewareFunction[]) => {
		this.preRequestMiddleware = middleware
	}

	public setPostRequestMiddleware = (...middleware: PostRequestMiddlewareFunction[]) => {
		this.postRequestMiddleware = middleware
	}

	private getRequestKey = (request: express.Request, cacheIgnoreProps?: string[]) => {
		const body = copyWithKeysDeleted(request.body, cacheIgnoreProps || [])
		return Object.keys(body)
			.sort()
			.map((k) => `${k}:${body[k]}`)
			.join(',')
	}
}
