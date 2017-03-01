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
import DatePicker from 'material-ui/DatePicker';
import timezones from 'react-timezone/src/timezones.json';
import TimezonePicker from 'react-timezone';
import Clock from 'react-clockwall';
import Toggle from '../Toggle';
import styles from './index.css';

const zoneKeys = Object.keys(timezones);

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
		} = this.props;

		const isBigEnough = rows && rows.size > rowsPerPage * renderingPagesCount;
		if (!rows
		|| firstDataID === null
		|| firstRowID !== firstDataID
		|| (isBigEnough && rowsPerPage * renderingPagesCount !== rows.size)
		|| (prevProps && prevProps.rowsCount !== rowsCount)) {
			getUsers(firstRowID || 0, rowsPerPage * renderingPagesCount);
		}
	}

	buildEmptyRows = (renderRowsCount: number, columnsCount: number) => {
		const { rowHeight, selectable } = this.props;

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
						.map((v, k) => <TableRowColumn key={k} style={rowColumnStyle} />)
					}
				</TableRow>
			)
		);
	}

	render() {
		const {
			headerColumns,
			stylesHeaderColumns,
			marginTop,
			rowHeight,
			firstRowID,
			firstDataID,
			rowsPerPage,
			renderingPagesCount,
			maxRows,
			rows,
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
					overflowX: 'auto',
					overflowY: 'hidden',
				}}
				bodyStyle={{
					overflowX: 'hidden',
					overflowY: 'hidden',
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
								<TableRowColumn style={rowColumnStyle}>
									<input styleName="table-input" value={row.name} />
								</TableRowColumn>
								<TableRowColumn style={rowColumnStyle}>
									<textarea styleName="table-textarea" value={row.description} />
								</TableRowColumn>
								<TableRowColumn style={rowColumnStyle}>
									<input styleName="table-input" value={row.phone} />
								</TableRowColumn>
								<TableRowColumn style={rowColumnStyle}>
									<DatePicker
										container="inline"
										mode="landscape"
										value={new Date(row.callDate * 60 * 1000)}
										className={styles.datePickerInput}
										/>
								</TableRowColumn>
								<TableRowColumn style={rowColumnStyle}>
									<TimezonePicker
										value={timezones[zoneKeys[row.timezone]]}
										className={styles.timezonePicker}
										/>
								</TableRowColumn>
								<TableRowColumn style={rowColumnStyle}>
									<Clock
										config={{
											town: timezones[zoneKeys[row.timezone]],
											timezone: timezones[zoneKeys[row.timezone]],
										}}
										/>
								</TableRowColumn>
								<TableRowColumn style={rowColumnStyle}>
									<Toggle label="Выкл" labelRight="Вкл" toggled={row.bool1} />
								</TableRowColumn>
							</TableRow>
						))
					}
				</TableBody>
			</Table>
		);
	}
}
