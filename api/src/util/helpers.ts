import { cloneDeep, isObject } from 'lodash'

export const copyWithKeysDeleted = (obj: any, keys: any[]): any => {
	const newObj: any = cloneDeep(obj)
	for (const key of keys) {
		newObj[key] = null
	}
	const returnObj: any = {}
	for (const k in newObj) {
		if (newObj.hasOwnProperty(k) && newObj[k] !== null) {
			returnObj[k] = newObj[k]
		}
	}
	return returnObj
}

export const cleaned = (anything: any, valueTypes: (null | undefined | string | boolean | number)[] = [undefined]) => {
	const doClean = (thing: any, valueTypes: (null | undefined | string | boolean | number)[]) => {
		for (const key in thing) {
			if (thing.hasOwnProperty(key)) {
				const value = thing[key]
				if (isObject(value)) {
					doClean(value, valueTypes)
				} else if (valueTypes.includes(value)) {
					delete thing[key]
				}
			}
		}
	}
	const cleanedCopy = cloneDeep(anything)
	doClean(cleanedCopy, valueTypes)
	return cleanedCopy
}
