type Environment = 'development'| 'production'

// COPY/PASTE YOUR CREDENTIALS BELOW
export const FIREBASE_CONFIG = {
    apiKey: "abc123",
    authDomain: "myproject.firebaseapp.com",
    projectId: "myproject",
    storageBucket: "myproject.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
}

export const ENVIRONMENT = (): Environment =>
	window.location.host.startsWith('localhost')
		? 'development'
		: 'production'

export const ENVIRONMENT_VALUE = (values: { development: any; production: any }) => values[ENVIRONMENT()]

export const API_URL = () =>
	ENVIRONMENT_VALUE({
		development: `http://localhost:5000/${FIREBASE_CONFIG.projectId}/us-central1/app`,
		production: `https://us-central1-${FIREBASE_CONFIG.projectId}.cloudfunctions.net/app/`,
	})
