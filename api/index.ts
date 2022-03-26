import { App, user } from './src'

// Create the app
const app = new App('api')

// Add routes
app.route(user)

// Export the app
exports.app = app.start()
