import React, { Component, PropTypes } from 'react';
import { Toggle } from 'material-ui';

export default class MyToggle extends Component {
	static propTypes = {
		style: PropTypes.object,
		onToggle: PropTypes.func,
		'data-id': PropTypes.oneOfType([
			PropTypes.number,
			PropTypes.string,
		]),
		'data-key': PropTypes.oneOfType([
			PropTypes.number,
			PropTypes.string,
		]),
		labelRight: PropTypes.string,
	};

	render() {
		const { labelRight } = this.props;
		const toggleProps = Object.assign({}, this.props);
		delete toggleProps.styles;
		delete toggleProps.labelRight;

		return (
			<div style={{ textAlign: 'center' }}>
				<Toggle
					{...toggleProps}
					style={{
						...toggleProps.style,
						...{
							display: 'inline-block',
							width: null,
							verticalAlign: 'middle',
							marginRight: 5,
						},
					}}
					labelStyle={{
						...toggleProps.labelStyle,
						...{
							color: toggleProps.toggled ? '#bec3c7' : null,
							lineHeight: '28px',
							marginRight: 10,
						},
					}}
					trackStyle={{
						...toggleProps.trackStyle,
						...{
							backgroundColor: '#bec3c7',
							width: 40,
							height: 20,
							marginLeft: 0,
						},
					}}
					thumbStyle={{
						...toggleProps.thumbStyle,
						...{
							backgroundColor: '#fff',
							width: 12,
							height: 12,
							lineHeight: '12px',
							top: 8,
							left: 8,
							boxShadow: null,
						},
					}}
					trackSwitchedStyle={{
						...toggleProps.trackSwitchedStyle,
						...{
							backgroundColor: '#af5fbe',
						},
					}}
					thumbSwitchedStyle={{
						...toggleProps.thumbSwitchedStyle,
						...{
							backgroundColor: '#fff',
						},
					}}
					/>
				<span
					onClick={toggleProps.onToggle}
					data-id={toggleProps['data-id'] || null}
					data-key={toggleProps['data-key'] || null}
					data-checked={toggleProps.toggled !== undefined ? !toggleProps.toggled : false}
					style={{
						lineHeight: '28px',
						cursor: 'pointer',
						verticalAlign: 'middle',
						color: !toggleProps.toggled ? '#bec3c7' : null,
						paddingLeft: 20,
					}}>
					{labelRight || null}
				</span>
			</div>
		);
	}
}
