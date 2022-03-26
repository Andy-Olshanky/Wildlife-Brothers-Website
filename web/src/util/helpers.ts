export const withKeysDeleted = (obj: any, keys: any[]): any => {
	const newObj = {} as any
	for (const key in obj) {
		if (!keys.includes(key)) {
			newObj[key] = (obj as any)[key]
		}
	}
	return newObj
}
