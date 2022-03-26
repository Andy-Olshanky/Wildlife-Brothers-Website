import { GetUserById, User } from '../../../idl'
import { Database, Table } from '../util'
import { Route } from './common'

export const user = new Route()

user.function(GetUserById, async (req, res, data) => {
	// User ID to get
	const { id } = req

	// Ensure the ID to fetch is provided
	if (!res.assert('id', 'string', true)) {
		return
	}

	// We prefer to perform all database operations in a single transaction
	await Database.atomic(async (t) => {
		const userTable = new Database(Table.User, t)

		// Get the user from the table
		const user = await userTable.get<User>(id)
		if (user === null) {
			return res.notFound()
		}

		res.ok(user)
	})
})
