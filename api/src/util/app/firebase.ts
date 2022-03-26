import { App, initializeApp } from 'firebase-admin/app'
import { Auth, getAuth } from 'firebase-admin/auth'
import { Firestore, getFirestore } from 'firebase-admin/firestore'

export class Firebase {
	private static instance: App
	private static firestore: Firestore
	private static auth: Auth

	private constructor() {}

	public static getInstance(): App {
		if (!Firebase.instance) {
			Firebase.instance = initializeApp()
		}
		return Firebase.instance
	}

	public static getDatabase(): Firestore {
		this.getInstance()
		if (!Firebase.firestore) {
			Firebase.firestore = getFirestore()
		}
		return Firebase.firestore
	}

	public static getAuth(): Auth {
		this.getInstance()
		if (!Firebase.auth) {
			Firebase.auth = getAuth()
		}
		return Firebase.auth
	}
}
