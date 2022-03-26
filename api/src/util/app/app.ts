import { json } from 'body-parser'
import cors from 'cors'
import express from 'express'
import * as functions from 'firebase-functions'
import {
	AuthMiddlewareFunction,
	MiddlewareFunction,
	PostRequestMiddlewareFunction,
	PreRequestMiddlewareFunction,
} from './middleware'
import { Route } from './route'

export type AppMemory = '128MB' | '256MB' | '512MB' | '1GB' | '2GB'

export type AppFunction = functions.HttpsFunction
export type AppSchedule = functions.CloudFunction<any>

export const DEFAULT_APP_NAME = 'app'
export const DEFAULT_TIMEOUT_S = 540
export const DEFAULT_MEMORY = '2GB' as AppMemory

export class App {
	private appName: string
	private app: express.Express
	private timeoutSec: number
	private memory: AppMemory

	private preRequestMiddleware: PreRequestMiddlewareFunction[]
	private postRequestMiddleware: PostRequestMiddlewareFunction[]

	private authMiddleware = [] as AuthMiddlewareFunction[]

	constructor(
		appName: string = DEFAULT_APP_NAME,
		timeoutSec: number = DEFAULT_TIMEOUT_S,
		memory: AppMemory = DEFAULT_MEMORY,
		preRequestMiddleware: MiddlewareFunction[] = [],
		postRequestMiddleware: PostRequestMiddlewareFunction[] = [],
		authMiddleware: AuthMiddlewareFunction[] = [],
	) {
		if (timeoutSec < 10 || timeoutSec > 540) {
			throw new Error('Invalid timeoutSec')
		}
		this.appName = appName

		this.app = express()
		this.app.use(cors({ origin: true }))
		this.app.use(json())

		this.timeoutSec = timeoutSec
		this.memory = memory

		this.preRequestMiddleware = preRequestMiddleware
		this.postRequestMiddleware = postRequestMiddleware
		this.authMiddleware = authMiddleware

		// Health check
		this.app.get('/', (_, res) => res.status(200).send(appName))
	}

	public route = (...routes: Route<any>[]) => {
		for (const route of routes) {
			route.setPreRequestMiddleware(...this.preRequestMiddleware)
			route.setPostRequestMiddleware(...this.postRequestMiddleware)
			route.setAuthMiddleware(...this.authMiddleware)
			this.app.use(route.expressRouter)
		}
	}

	public start = (): AppFunction => {
		return functions
			.runWith({ timeoutSeconds: this.timeoutSec, memory: this.memory })
			.https.onRequest(async (req, res) => this.app(req, res))
	}
}
