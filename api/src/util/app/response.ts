import { StatusCodes } from 'http-status-codes'
import { isArray, isBoolean, isFunction, isNumber, isObject, isString } from 'lodash'
import { ExpressResponse } from './express'

export type ResponseBody = any
export type ResponseCallback = (code: number, body?: ResponseBody) => void

export type AssertionType = 'array' | 'object' | 'string' | 'number' | 'boolean' | 'function'

export class Response<RequestType, ResponseType> {
	private req: RequestType
	private res: ExpressResponse

	/** Lock this response as a backup so it's not send twice. */
	private lock: boolean
	private callback?: ResponseCallback

	// Populated on response
	private code?: number
	private message?: string

	get isLocked() {
		return this.lock
	}

	get statusCode() {
		return this.code
	}

	get statusMessage() {
		return this.message
	}

	constructor(req: RequestType, res: ExpressResponse, callback?: ResponseCallback) {
		this.req = req
		this.res = res
		this.lock = false
		this.callback = callback
	}

	public sendResponse = (code: number, body?: ResponseBody, doRunCallback: boolean = true) => {
		if (!this.lock) {
			if (isObject(body) || isArray(body)) {
				this.res.status(code).json(body)
				this.message = JSON.stringify(body)
			} else if (isString(body)) {
				this.res.status(code).send(body)
				this.message = body
			} else {
				this.res.sendStatus(code)
			}
			this.lock = true
			this.code = code
			doRunCallback && this.callback && this.callback(code, body)
		}
	}

	/**
	 * Assert the presence of a value for parameter testing.
	 * Sends a "400 Bad Request" if the check fails.
	 * @param key The key in the request object that is being tested. Split with dots to access
	 * child properties of an object, such as `event.eventName`.
	 * @param type The type of the value to assert.
	 * @param isRequired Is the parameter required?
	 * @returns True if the assertion passes, false otherwise.
	 */
	public assert = (key: keyof RequestType | string, type: AssertionType, isRequired = false): boolean => {
		let value = null as any
		if (isString(key)) {
			const splitKey = (key as string).split('.')
			value = (this.req as any)[splitKey[0]]
			for (let i = 1; i < splitKey.length; i++) {
				if (value.hasOwnProperty(splitKey[i])) {
					value = value[splitKey[i]]
				} else {
					return !isRequired
				}
			}
		} else {
			value = (this.req as any)[key]
		}
		if (isRequired || (!isRequired && value)) {
			if (
				(type === 'array' && !isArray(value)) ||
				(type === 'boolean' && !isBoolean(value)) ||
				(type === 'function' && !isFunction(value)) ||
				(type === 'number' && !isNumber(value)) ||
				(type === 'object' && !isObject(value)) ||
				(type === 'string' && !isString(value))
			) {
				this.badRequest(`${key} is not a valid ${type}`)
				return false
			}
		}
		return true
	}

	// Success response:

	public ok = (res: ResponseType) => {
		this.sendResponse(StatusCodes.OK, res)
	}

	// Failure responses:

	public continue = (body?: ResponseBody) => {
		this.sendResponse(StatusCodes.CONTINUE, body)
	}

	public noContent = (body?: ResponseBody) => {
		this.sendResponse(StatusCodes.NO_CONTENT, body)
	}

	public movedPermanently = (body?: ResponseBody) => {
		this.sendResponse(StatusCodes.MOVED_PERMANENTLY, body)
	}

	public badRequest = (body?: ResponseBody) => {
		this.sendResponse(StatusCodes.BAD_REQUEST, body)
	}

	public unauthorized = (body?: ResponseBody) => {
		this.sendResponse(StatusCodes.UNAUTHORIZED, body)
	}

	public paymentRequired = (body?: ResponseBody) => {
		this.sendResponse(StatusCodes.PAYMENT_REQUIRED, body)
	}

	public forbidden = (body?: ResponseBody) => {
		this.sendResponse(StatusCodes.FORBIDDEN, body)
	}

	public notFound = (body?: ResponseBody) => {
		this.sendResponse(StatusCodes.NOT_FOUND, body)
	}

	public methodNotAllowed = (body?: ResponseBody) => {
		this.sendResponse(StatusCodes.METHOD_NOT_ALLOWED, body)
	}

	public notAcceptable = (body?: ResponseBody) => {
		this.sendResponse(StatusCodes.NOT_ACCEPTABLE, body)
	}

	public requestTimeout = (body?: ResponseBody) => {
		this.sendResponse(StatusCodes.REQUEST_TIMEOUT, body)
	}

	public conflict = (body?: ResponseBody) => {
		this.sendResponse(StatusCodes.CONFLICT, body)
	}

	public gone = (body?: ResponseBody) => {
		this.sendResponse(StatusCodes.GONE, body)
	}

	public tooManyRequests = (body?: ResponseBody) => {
		this.sendResponse(StatusCodes.TOO_MANY_REQUESTS, body)
	}

	public internalServerError = (body?: ResponseBody) => {
		this.sendResponse(StatusCodes.INTERNAL_SERVER_ERROR, body)
	}

	public notImplemented = (body?: ResponseBody) => {
		this.sendResponse(StatusCodes.NOT_IMPLEMENTED, body)
	}

	public serviceUnavailable = (body?: ResponseBody) => {
		this.sendResponse(StatusCodes.SERVICE_UNAVAILABLE, body)
	}
}
