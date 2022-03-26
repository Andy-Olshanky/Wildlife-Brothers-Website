import { FirebaseApp, initializeApp } from "firebase/app"
import { Auth, connectAuthEmulator, initializeAuth } from "firebase/auth"
import { Firestore, initializeFirestore } from "firebase/firestore"
import { FIREBASE_CONFIG, ENVIRONMENT } from "./env"


const LOCAL_FIREBASE_PORTS = {
	AUTH: 5777,
	FIRESTORE: 5420,
}

export class Firebase {
	private static instance: FirebaseApp
	private static firestore: Firestore
	private static auth: Auth

	private static isLocal = () => {
		return ENVIRONMENT() === 'development'
	}

	public static getInstance(): FirebaseApp {
		if (!Firebase.instance) {
			Firebase.instance = initializeApp(FIREBASE_CONFIG)
		}
		return Firebase.instance
	}

	public static getDatabase(): Firestore {
		if (!Firebase.firestore) {
			if (Firebase.isLocal()) {
				Firebase.firestore = initializeFirestore(Firebase.getInstance(), {
					host: `localhost:${LOCAL_FIREBASE_PORTS.FIRESTORE}`,
					ssl: false,
				})
			} else {
				Firebase.firestore = initializeFirestore(Firebase.getInstance(), {})
			}
		}
		return Firebase.firestore
	}

	public static getAuth(): Auth {
		if (!Firebase.auth) {
			Firebase.auth = initializeAuth(Firebase.getInstance(), {})
			if (Firebase.isLocal()) {
				connectAuthEmulator(Firebase.auth, `http://localhost:${LOCAL_FIREBASE_PORTS.AUTH}`)
			}
		}
		return Firebase.auth
	}
}
