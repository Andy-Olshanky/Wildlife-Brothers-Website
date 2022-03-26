import { ExpressRequest } from './express'
import { Response } from './response'

export type MiddlewareFunction<T = void> = (req: ExpressRequest, res: Response<any, any>) => Promise<T>

/**
 * Middleware to authenticate the request.
 * @param req The request object.
 * @param res The response object.
 * @param required If true, the middleware is encouraged to send an unauthorized response
 * if the request is not authenticated. Otherwise, the middleware can do whatever the hell it
 * wants.
 */
export type AuthMiddlewareFunction = (req: ExpressRequest, res: Response<any, any>, required: boolean) => Promise<any>

export type PreRequestMiddlewareFunction<T = void> = MiddlewareFunction<T>

export type PostRequestMiddlewareFunction<T = void> = (
	req: ExpressRequest,
	res: Response<any, any>,
	startTimestamp: number,
	endTimestamp: number,
) => Promise<T>
