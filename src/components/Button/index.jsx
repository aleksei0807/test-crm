/* @flow */
import React, { Component } from 'react';
import CSSModules from 'react-css-modules';
import classnames from 'classnames';
import ProgressButton from 'react-progress-button';
import 'react-progress-button/react-progress-button.css';
import styles from './index.css';

@CSSModules(styles)
export default class Button extends Component {
	render() {
		const buttonProps = { ...this.props };
		delete buttonProps.styles;
		delete buttonProps.transparent;

		const buttonClasses = classnames({
			[styles.button]: true,
			[styles.transparentButton]: this.props.transparent,
			[this.props.className]: this.props.className || false,
		});

		return (
			<ProgressButton {...buttonProps} className={buttonClasses} />
		);
	}
}
