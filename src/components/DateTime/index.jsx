/* @flow */
import React, { Component, PropTypes } from 'react';
import CSSModules from 'react-css-modules';
import moment from 'moment-timezone';
import DatePicker from 'material-ui/DatePicker';
import TimePicker from 'material-ui/TimePicker';
import styles from './index.css';

@CSSModules(styles)
export default class DateTime extends Component {
	static propsTypes = {
		timestamp: PropTypes.number.isRequired,
		timezone: PropTypes.string.isRequired,
		onChange: PropTypes.func.isRequired,
		key: PropTypes.string,
	};

	getDate(callDate: number, timeZone: string) {
		const trueCallDate = callDate * 60 * 1000;
		const offset = moment.tz.zone(timeZone).parse(new Date(trueCallDate)) * 60 * 1000;
		return new Date(trueCallDate - offset);
	}

	setDate(timeZone: string, onChange: Function) {
		return (_: any, date: Date) => {
			const offset = moment.tz.zone(timeZone).parse(new Date(date)) * 60 * 1000;
			const timestamp = Math.floor((date.getTime() + offset) / 60 / 1000);
			onChange(timestamp);
		};
	}

	render() {
		const { timestamp, timezone, onChange, key } = this.props;

		return (
			<div>
				<DatePicker
					container="inline"
					mode="landscape"
					value={this.getDate(timestamp, timezone)}
					className={styles.datePickerInput}
					textFieldStyle={{
						height: null,
						lineHeight: null,
						fontSize: null,
						width: null,
					}}
					name={`datepicker-${key || 'default'}`}
					onChange={this.setDate(timezone, onChange)}
					/>
				<TimePicker
					format="24hr"
					value={this.getDate(timestamp, timezone)}
					className={styles.timePickerInput}
					style={{
						width: '40%',
						display: 'inline-block',
						paddingLeft: 10,
					}}
					textFieldStyle={{
						height: null,
						lineHeight: null,
						fontSize: null,
						width: null,
					}}
					name={`timepicker-${key || 'default'}`}
					onChange={this.setDate(timezone, onChange)}
					/>
			</div>
		);
	}
}
