import { isBoolean, isString } from 'lodash'

export class Styles {
	public static classNames = (...classNames: (string | null | boolean | undefined)[]): string => {
		let result = ''
		for (const className of classNames) {
			if (className && !isBoolean(className) && isString(className) && className !== '') {
				result += ` ${className}`
			}
		}
		return result
	}

	public static add = (className: string, ...classesToAdd: string[]): string => {
		return Styles.classNames(...[className].concat(classesToAdd))
	}

	public static remove = (className: string, ...classesToRemove: string[]): string => {
		const classNames = className.split(' ')
		for (const classToRemove of classesToRemove) {
			const index = classNames.indexOf(classToRemove)
			if (index >= 0) {
				classNames.splice(index, 1)
			}
		}
		return classNames.join(' ')
	}
}
