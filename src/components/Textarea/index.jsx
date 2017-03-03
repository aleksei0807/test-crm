/* @flow */
import React, { Component, PropTypes } from 'react';
import CSSModules from 'react-css-modules';
import styles from './index.css';

@CSSModules(styles)
export default class Textarea extends Component {
	static propsTypes = {
		value: PropTypes.string,
		onChange: PropTypes.func.isRequired,
	};

	onChange(onChange: Function) {
		return (v: Event) => {
			if (v.target instanceof HTMLTextAreaElement) {
				onChange(v.target.value);
			}
		};
	}

	render() {
		const { value, onChange } = this.props;

		return (
			<textarea
				styleName="textarea"
				value={value}
				onChange={this.onChange(onChange)}
				/>
		);
	}
}
