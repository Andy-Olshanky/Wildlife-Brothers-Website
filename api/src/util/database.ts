import { WhereFilterOp } from '@google-cloud/firestore'
import { firestore } from 'firebase-admin'
import { Id } from '../../../idl'
import { Firebase } from './app'
import { cleaned } from './helpers'

export enum Table {
	User = 'user',
}

const DEFAULT_OPERATOR = '=='

export type DatabaseTransaction = firestore.Transaction
export type QueryPart = {
	property: string
	value: any
	operator?: WhereFilterOp | undefined
}

// Table-specific database helper
export class Database {
	private table: Table
	private collection: firestore.CollectionReference
	private transaction: firestore.Transaction | null

	constructor(table: Table, transaction: DatabaseTransaction | null = null) {
		this.table = table
		this.collection = Firebase.getDatabase().collection(this.table)
		this.transaction = transaction
	}

	/**
	 * Issues a callback from where atomic operations may be performed.
	 * @param callback The callback where atomic operations may be performed.
	 */
	public static atomic = async (callback: (_: DatabaseTransaction) => Promise<void>) => {
		return Firebase.getDatabase().runTransaction(callback)
	}

	// Converts a string key to an object
	private convertKey = (key: Id | any): any => (typeof key === 'string' ? key : String(key))

	/**
	 * Gets all documents (dangerous).
	 * @returns A promise containing a list of documents.
	 */
	public getAll = async <T>(): Promise<T[]> => {
		try {
			const ref = this.collection
			let res = undefined as firestore.QuerySnapshot | undefined
			if (this.transaction) {
				res = await this.transaction.get(ref)
			} else {
				res = await ref.get()
			}
			return res.docs.map((d) => d.data()) as T[]
		} catch (e) {
			return []
		}
	}

	/**
	 * Get an item.
	 * @param key The Id or object key for the item.
	 * @returns A promise containing the value or null, if it is not found.
	 */
	public get = async <T>(key: Id | any): Promise<T | null> => {
		// Convert the key to an object if it is a string (Id)
		key = this.convertKey(key)

		try {
			const ref = this.collection.doc(key)
			let res = undefined as firestore.DocumentSnapshot | undefined
			if (this.transaction) {
				res = await this.transaction.get(ref)
			} else {
				res = await ref.get()
			}
			if (!res.exists) {
				return null
			}
			return res.data() as T
		} catch (e) {
			return null
		}
	}

	/**
	 * Gets a list of items matching a query.
	 * @param property The property to query for.
	 * @param value The value of the property being queried.
	 * @param operator The comparison operator to use. Default '=='.
	 * @returns A promise containing the value or null, if it is not found.
	 */
	public query = async <T>(
		property: string,
		value: any,
		operator: WhereFilterOp = DEFAULT_OPERATOR,
	): Promise<T[]> => {
		try {
			const ref = this.collection.where(property, operator, value)
			let res = undefined as firestore.QuerySnapshot | undefined
			if (this.transaction) {
				res = await this.transaction.get(ref)
			} else {
				res = await ref.get()
			}
			if (!res.size) {
				return []
			}
			return res.docs.map((d) => d.data()) as T[]
		} catch (e) {
			return []
		}
	}

	/**
	 * Gets a list of items matching a multipart query.
	 * @param parts A list of query tuples.
	 * @returns A promise containing the value or null, if it is not found.
	 */
	public multipartQuery = async <T>(
		parts: QueryPart[],
		orderByParts: { key: string; direction: 'desc' | 'asc' }[] = [],
		limit?: number,
		skip?: number,
	): Promise<T[]> => {
		try {
			const { property, value, operator = DEFAULT_OPERATOR } = parts[0]
			let query = this.collection.where(property, operator, value)
			for (let i = 1; i < parts.length; i++) {
				const { property, value, operator = DEFAULT_OPERATOR } = parts[i]
				query = query.where(property, operator, value)
			}
			for (let i = 0; i < orderByParts.length; i++) {
				query = query.orderBy(orderByParts[i].key, orderByParts[i].direction)
			}
			if (skip) {
				query = query.offset(skip)
			}
			if (limit) {
				query = query.limit(limit)
			}
			let res = undefined as firestore.QuerySnapshot | undefined
			if (this.transaction) {
				res = await this.transaction.get(query)
			} else {
				res = await query.get()
			}
			if (!res.size) {
				return []
			}
			return res.docs.map((d) => d.data()) as T[]
		} catch (e) {
			console.error(e)
			return []
		}
	}

	/**
	 * Checks if an item with the given key exists in the database.
	 * @param key The Id or object key for the item.
	 * @returns True if the item exists, false otherwise.
	 */
	public has = async (key: Id | any): Promise<boolean> => {
		return (await this.get(key)) !== null
	}

	/**
	 * Creates a key/value pair in the database.
	 * @param value A full/partial object literal with an 'id' property.
	 */
	public createPair = async <T>(key: Id | any, value: T): Promise<boolean> => {
		// Remove undefined keys
		value = cleaned(value)
		if (Object.keys(value).length === 0) {
			return false
		}

		try {
			const timestamp = Date.now()
			value = { ...value, createdAt: timestamp, updatedAt: timestamp }
			const ref = this.collection.doc(key)
			if (this.transaction) {
				this.transaction.set(ref, value)
			} else {
				await ref.set(value)
			}
			return true
		} catch {
			return false
		}
	}

	/**
	 * Create a key/value pair in the database.
	 * @param value A full/partial object literal with an 'id' property.
	 */
	public create = async <T>(value: T & { id: any }): Promise<boolean> => {
		// Convert the key to an object if it is a string (Id)
		const key = (value as any).hasOwnProperty('id') ? value.id : null
		if (key === null) {
			throw new Error('Value must contain an `id` property.')
		}

		return this.createPair(key, value)
	}

	/**
	 * Updates a key/value pair in the database.
	 * @param value A full/partial object literal with an 'id' property.
	 */
	public updatePair = async <T>(key: Id | any, value: Partial<T> & { updatedAt?: number }): Promise<boolean> => {
		// Remove undefined keys
		value = cleaned(value)
		if (Object.keys(value).length === 0) {
			return false
		}

		// Update the value
		try {
			value.updatedAt = Date.now()
			const ref = this.collection.doc(key)
			if (this.transaction) {
				this.transaction.update(ref, value)
			} else {
				await ref.update(value)
			}
			return true
		} catch (e) {
			return false
		}
	}

	/**
	 * Updates a key/value pair in the database.
	 * @param value A full/partial object literal with an 'id' property.
	 */
	public update = async <T>(value: Partial<T> & { id: any; updatedAt?: number }): Promise<boolean> => {
		// Convert the key to an object if it is a string (Id)
		const key = value.hasOwnProperty('id') ? value.id : null
		if (key === null) {
			throw new Error('Value must contain an `id` property.')
		}

		return this.updatePair(key, value)
	}

	/**
	 * Sets a key/value pair in the database.
	 * @param value A full/partial object literal with an 'id' property.
	 */
	public setPair = async <T>(key: Id | any, value: Partial<T> & { updatedAt?: number }): Promise<boolean> => {
		// Remove undefined keys
		value = cleaned(value)
		if (Object.keys(value).length === 0) {
			return false
		}

		// Update the value
		try {
			value.updatedAt = Date.now()
			const ref = this.collection.doc(key)
			if (this.transaction) {
				this.transaction.set(ref, value)
			} else {
				await ref.set(value)
			}
			return true
		} catch (e) {
			return false
		}
	}

	/**
	 * Sets a key/value pair in the database.
	 * @param value A full/partial object literal with an 'id' property.
	 */
	public set = async <T>(value: Partial<T> & { id: any; updatedAt?: number }): Promise<boolean> => {
		// Convert the key to an object if it is a string (Id)
		const key = value.hasOwnProperty('id') ? value.id : null
		if (key === null) {
			throw new Error('Value must contain an `id` property.')
		}

		return this.setPair(key, value)
	}

	/**
	 * Adds a value to a collection in the database.
	 * @param value A full object literal with an 'id' property.
	 */
	public add = async <T>(value: T & { id: any }): Promise<boolean> => {
		// Remove undefined keys
		value = cleaned(value)
		if (Object.keys(value).length === 0) {
			return false
		}

		try {
			await this.collection.add(value)
			return true
		} catch {
			return false
		}
	}

	/**
	 * Deletes a key from the table, returning true if it's deleted.
	 * @param key The key to delete.
	 * @returns True if the value with the key in the table is deleted, false otherwise.
	 */
	public delete = async (key: Id | any): Promise<boolean> => {
		key = this.convertKey(key)
		if (await this.has(key)) {
			try {
				const ref = this.collection.doc(key)
				if (this.transaction) {
					this.transaction.delete(ref)
				} else {
					await ref.delete()
				}
				return true
			} catch {
				return false
			}
		}
		return false
	}
}
