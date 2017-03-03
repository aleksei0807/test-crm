/* @flow */
import React, { Component, PropTypes } from 'react';
import CSSModules from 'react-css-modules';
import classnames from 'classnames';
import {
	Table,
	TableBody,
	TableHeader,
	TableHeaderColumn,
	TableRow,
	TableRowColumn,
} from 'material-ui/Table';
import timezones from 'react-timezone/src/timezones.json';
import TimezonePicker from 'react-timezone';
import Clock from 'react-clockwall';
import moment from 'moment-timezone';
import Preloader from 'halogen/BeatLoader';
import { primary1Color } from '../../styles/vars';
import Toggle from '../Toggle';
import DateTime from '../DateTime';
import Input from '../Input';
import Textarea from '../Textarea';
import styles from './index.css';

const zoneKeys = Object.keys(timezones);
const zoneMap = zoneKeys.reduce(
	(prev, current, idx) => ({ ...prev, ...{ [timezones[current]]: idx }}),
{});

const headerColumnStyle = {
	fontSize: 11,
	whiteSpace: 'initial',
};

const rowColumnStyle = {
	whiteSpace: 'initial',
	paddingTop: null,
	paddingBottom: null,
	height: 100,
	overflow: 'visible',
};

@CSSModules(styles)
export default class UserList extends Component {
	static propTypes = {
		headerColumns: PropTypes.arrayOf(PropTypes.string).isRequired,
		stylesHeaderColumns: PropTypes.array,
		stylesRowColumns: PropTypes.array,
		selectable: PropTypes.bool,
		rowChilds: PropTypes.arrayOf(
			PropTypes.oneOfType([
				PropTypes.string,
				PropTypes.element,
			])
		),
		rows: PropTypes.oneOfType([
			PropTypes.arrayOf(
				PropTypes.arrayOf(
					PropTypes.oneOfType([
						PropTypes.string,
						PropTypes.element,
					])
				)
			),
			PropTypes.object,
		]),
		marginTop: PropTypes.number,
		rowHeight: PropTypes.number,
		firstRowID: PropTypes.number,
		rowsPerPage: PropTypes.number,
		renderingPagesCount: PropTypes.number,
		getUsers: PropTypes.func,
		changeUser: PropTypes.func,
		pendingLoading: PropTypes.bool,
	};

	componentDidMount() {
		this.getData();
	}

	componentDidUpdate(prevProps: Object) {
		this.getData(prevProps);
	}

	getData = (prevProps?: Object) => {
		const {
			firstRowID,
			firstDataID,
			rowsPerPage,
			renderingPagesCount,
			rows,
			getUsers,
			rowsCount,
			pendingLoading,
		} = this.props;

		const isBigEnough = rowsCount > rowsPerPage * renderingPagesCount;
		if ((!rows
		|| firstDataID === null
		|| firstRowID !== firstDataID
		|| (isBigEnough && rowsPerPage * renderingPagesCount !== rows.size)
		|| (prevProps && prevProps.rowsCount !== rowsCount)) && !pendingLoading) {
			getUsers(firstRowID || 0, rowsPerPage * renderingPagesCount);
		}
	}

	getTimezone(timeZoneID: number) {
		return timezones[zoneKeys[timeZoneID]];
	}

	buildEmptyRows = (renderRowsCount: number, columnsCount: number) => {
		const { rowHeight, selectable, stylesRowColumns } = this.props;

		return Array.from({ length: renderRowsCount })
			.map((_, key) => (
				<TableRow
					selectable={selectable}
					key={key}
					className="row"
					data-id={key}
					style={{
						height: rowHeight,
					}}>
					{
						Array.from({ length: columnsCount })
						.map((v, k) => (
							<TableRowColumn
								key={k}
								style={stylesRowColumns ? {
									...rowColumnStyle,
									...(stylesRowColumns[k] || {}),
								} : rowColumnStyle}>
								{k === 0 ? <Preloader color={primary1Color} /> : null}
							</TableRowColumn>
						))
					}
				</TableRow>
			)
		);
	}

	render() {
		const {
			headerColumns,
			stylesHeaderColumns,
			stylesRowColumns,
			marginTop,
			rowHeight,
			firstRowID,
			firstDataID,
			rowsPerPage,
			renderingPagesCount,
			maxRows,
			rows,
			changeUser,
		} = this.props;

		let renderRowsCount = rowsPerPage * renderingPagesCount;
		if (maxRows !== null) {
			renderRowsCount = maxRows;
		}

		const isBigEnough = rows && rows.size > rowsPerPage * renderingPagesCount;

		const emptyRows = !rows
		|| firstDataID === null
		|| firstRowID !== firstDataID
		|| (isBigEnough && rowsPerPage * renderingPagesCount !== rows.size);

		const tableBodyClass = classnames({
			[styles['table-body']]: true,
			[styles.empty]: emptyRows,
		});

		return (
			<Table
				styleName="table"
				selectable={!emptyRows}
				wrapperStyle={{
					height: '100%',
					marginTop: marginTop || 25,
					border: '1px solid #e5e5e5',
				}}
				bodyStyle={{
					overflowX: 'visible',
					overflowY: 'visible',
					minWidth: '690px',
				}}>
				<TableHeader styleName="table-header" displaySelectAll={false} adjustForCheckbox={false} >
					<TableRow className={styles['header-row']}>
						{
							headerColumns.map((column, key) => (
								<TableHeaderColumn
									className={styles['header-column']}
									key={key}
									style={stylesHeaderColumns ? {
										...headerColumnStyle,
										...stylesHeaderColumns[key],
									} || headerColumnStyle : headerColumnStyle}>
									{column}
								</TableHeaderColumn>
							))
						}
					</TableRow>
				</TableHeader>
				<TableBody
					className={tableBodyClass}
					displayRowCheckbox={false}>
					{
						emptyRows ? this.buildEmptyRows(renderRowsCount, headerColumns.length)
						: rows.map((row, key) => (
							<TableRow
								selectable={false}
								key={key}
								className="row"
								data-id={key}
								style={{
									height: rowHeight,
								}}>
								<TableRowColumn
									style={stylesRowColumns ? {
										...rowColumnStyle,
										...(stylesRowColumns[0] || {}),
									} : rowColumnStyle}>
									<Input
										value={row.name}
										onChange={(v) => {
											changeUser(key, 'name', v);
										}}
										/>
								</TableRowColumn>
								<TableRowColumn
									style={stylesRowColumns ? {
										...rowColumnStyle,
										...(stylesRowColumns[1] || {}),
									} : rowColumnStyle}>
									<Textarea
										value={row.description}
										onChange={(v) => {
											changeUser(key, 'description', v);
										}}
										/>
								</TableRowColumn>
								<TableRowColumn
									style={stylesRowColumns ? {
										...rowColumnStyle,
										...(stylesRowColumns[2] || {}),
									} : rowColumnStyle}>
									<Input
										value={row.phone}
										onChange={(v) => {
											changeUser(key, 'phone', v);
										}}
										/>
								</TableRowColumn>
								<TableRowColumn
									style={stylesRowColumns ? {
										...rowColumnStyle,
										...(stylesRowColumns[3] || {}),
									} : rowColumnStyle}>
									<div
										style={{
											paddingBottom: 10,
										}}>
										<div>В таймзоне клиента:</div>
										<DateTime
											timestamp={row.callDate}
											timezone={this.getTimezone(row.timezone)}
											key={`client-${key}`}
											onChange={(v) => {
												changeUser(key, 'callDate', v);
											}}
											/>
									</div>
									<div>
										<div>В текущей таймзоне:</div>
										<DateTime
											timestamp={row.callDate}
											timezone={moment.tz.guess()}
											key={`current-${key}`}
											onChange={(v) => {
												changeUser(key, 'callDate', v);
											}}
											/>
									</div>
								</TableRowColumn>
								<TableRowColumn
									style={stylesRowColumns ? {
										...rowColumnStyle,
										...(stylesRowColumns[4] || {}),
									} : rowColumnStyle}>
									<TimezonePicker
										value={this.getTimezone(row.timezone)}
										className={styles.timezonePicker}
										onChange={(v) => {
											changeUser(key, 'timezone', zoneMap[v]);
										}}
										/>
								</TableRowColumn>
								<TableRowColumn
									style={stylesRowColumns ? {
										...rowColumnStyle,
										...(stylesRowColumns[5] || {}),
									} : rowColumnStyle}>
									<Clock
										config={{
											town: this.getTimezone(row.timezone),
											timezone: this.getTimezone(row.timezone),
											showTown: true,
											showTimezone: true,
											showDate: true,
										}}
										/>
								</TableRowColumn>
								<TableRowColumn
									style={stylesRowColumns ? {
										...rowColumnStyle,
										...(stylesRowColumns[6] || {}),
									} : rowColumnStyle}>
									<Toggle
										label="Выкл"
										labelRight="Вкл"
										toggled={row.bool1}
										onToggle={(v) => {
											changeUser(key, 'bool1', v);
										}}
										/>
								</TableRowColumn>
							</TableRow>
						))
					}
				</TableBody>
			</Table>
		);
	}
}
