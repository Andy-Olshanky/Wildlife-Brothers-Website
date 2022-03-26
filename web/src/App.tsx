import React, { useState } from 'react'
import { BrowserRouter as Router, Route as ReactRoute, Switch } from 'react-router-dom'
import './globals.module.sass'
import './index.module.sass'
import { Route } from './models'

import { Home } from './pages'

const ROUTES: Route[] = [
	{
		name: 'Home',
		path: '/',
		page: Home,
		auth: 'BOTH',
		exact: true,
	},
]

export const App = () => {
    // Do some kind of auth check here
	const [isAuthorized] = useState(false)

	return (
        <Router>
            <Switch>
                {ROUTES.filter(
                        (r) =>
                            (isAuthorized && (r.auth === 'LOGGED_IN' || r.auth === 'BOTH')) ||
                            (!isAuthorized && (r.auth === 'NOT_LOGGED_IN' || r.auth === 'BOTH')),
                    )
                    .map((route) => (
                        <ReactRoute key={route.name} path={route.path} children={route.page} caseSensitive={route.exact} />
                    ))}
            </Switch>
        </Router>
	)
}
