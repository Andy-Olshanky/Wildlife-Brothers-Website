import React, { forwardRef } from 'react'
import { Styles, withKeysDeleted } from '../../util'

type Viewport = 'phone' | 'tablet' | 'desktop'
export type DynamicClassName = string | null | boolean | undefined
export type DynamicClassNames = DynamicClassName[]

interface ViewProps extends Omit<Omit<React.HTMLAttributes<HTMLDivElement>, 'unselectable'>, 'className'> {
	visibleViewport?: Viewport
	hiddenViewport?: Viewport
	ref?: any
	inline?: boolean
	tagType?: string
	unselectable?: boolean
	animated?: boolean
	stringHTML?: string
	disabled?: boolean
	className?: DynamicClassName
	classNames?: DynamicClassNames
}

export const View = forwardRef((props: ViewProps, ref: any) => {
	const divProps = withKeysDeleted(props, [
		'visibleViewport',
		'hiddenViewport',
		'className',
		'inline',
		'tagType',
		'unselectable',
		'animated',
		'stringHTML',
		'classNames',
		'disabled',
	])
	const tagType = props.inline ? 'span' : props.tagType || 'div'

	let className = ''
	if (props.visibleViewport) {
		if (props.visibleViewport === 'phone') {
			className = Styles.add(className, 'd-block', 'd-sm-none')
		} else if (props.visibleViewport === 'tablet') {
			className = Styles.add(className, 'd-none', 'd-sm-block', 'd-md-none')
		} else if (props.visibleViewport === 'desktop') {
			className = Styles.add(className, 'd-none', 'd-sm-none', 'd-md-block')
		}
	} else if (props.hiddenViewport) {
		if (props.hiddenViewport === 'phone') {
			className = Styles.add(className, 'd-none', 'd-sm-block')
		} else if (props.hiddenViewport === 'tablet') {
			className = Styles.add(className, 'd-sm-none', 'd-md-block')
		} else if (props.hiddenViewport === 'desktop') {
			className = Styles.add(className, 'd-md-none')
		}
	}
	if (props.disabled) {
		className = Styles.add(className, 'disabled')
	}
	if (props.unselectable) {
		className = Styles.add(className, 'unselectable')
	}
	if (props.animated) {
		className = Styles.add(className, 'animated')
	}
	className = Styles.add(className, props.className === true ? '' : props.className || '')
	if (props.classNames) {
		className = Styles.classNames(className, ...props.classNames)
	}
	divProps.className = className || undefined
	divProps.ref = ref || undefined
	if (props.stringHTML) {
		divProps.dangerouslySetInnerHTML = { __html: props.stringHTML }
	}

	return React.createElement(tagType, divProps, props.children)
})
