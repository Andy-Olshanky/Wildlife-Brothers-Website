import fetch from 'cross-fetch'
import { isObject } from 'lodash'
import { ProtocolFunctionInterface } from '../../../idl'

export type ClientStatusCallback = (res: Response) => Promise<void>
export type ClientStatusCallbacks = { [status: number]: ClientStatusCallback }

export class Client {
	private apiUrl: string
	private statusCallbacks: ClientStatusCallbacks

	constructor(apiUrl: string, statusCallbacks: ClientStatusCallbacks = {}) {
		if (apiUrl.lastIndexOf('/') === apiUrl.length - 1) {
			apiUrl = apiUrl.substring(0, apiUrl.length - 1)
		}
		this.apiUrl = apiUrl
		this.statusCallbacks = statusCallbacks
	}

	/**
	 * Calls a protocol function, returning its response body or propagating the error.
	 * @param protocol The protocol function to call.
	 * @param body The body of the request, usually an object.
	 * @returns Asynchronously returns a response.
	 * @throws An error coming from the API.
	 */
	public call = async <RequestType, ResponseType>(
		protocol: ProtocolFunctionInterface<RequestType, ResponseType>,
		body: RequestType,
	): Promise<ResponseType> => {
		const options = protocol.options
		if (options.path[0] !== '/') {
			throw Error('Protocol path must start with a slash')
		}

		const uri = this.getUri(options.path)

		const getResponse = async (): Promise<ResponseType> => {
			const isObjectBody = isObject(body)
			const res = await fetch(uri, {
				method: options.method,
				body: isObjectBody ? JSON.stringify(body) : (body as any),
				headers: {
					'Content-Type': isObjectBody ? 'application/json' : 'text/plain',
				},
			})
			return this.parseResponse(res)
		}

		return getResponse()
	}

	/**
	 * Creates a URI from the endpoint and API URL.
	 * @param endpoint The endpoint to append.
	 * @returns A string URI to the given endpoint.
	 */
	private getUri = (endpoint: string): string => this.apiUrl + endpoint

	private parseResponse = async <ResponseType>(res: Response): Promise<ResponseType> => {
		const resText = await res.text()
		if (this.statusCallbacks.hasOwnProperty(res.status)) {
			await this.statusCallbacks[res.status](res)
		}
		if (!res.ok) {
			throw new Error(resText)
		}
		// Return null if the response is null
		if (resText === 'null') {
			return null as any as ResponseType
		}
		// Return JSON if the response is JSON
		try {
			const resJson = JSON.parse(resText)
			if (isObject(resJson)) {
				return resJson as any as ResponseType
			}
		} catch {}

		// Return text if the response is text
		return resText as any as ResponseType
	}
}
