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
import styles from './index.css';

const headerColumnStyle = {
	fontSize: 11,
	whiteSpace: 'initial',
};

const rowColumnStyle = {
	paddingTop: 30,
	paddingBottom: 30,
	whiteSpace: 'initial',
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
		rows: PropTypes.arrayOf(
			PropTypes.arrayOf(
				PropTypes.oneOfType([
					PropTypes.string,
					PropTypes.element,
				])
			)
		),
		marginTop: PropTypes.number,
		rowHeight: PropTypes.number,
		firstRowID: PropTypes.number,
		rowsPerPage: PropTypes.number,
		renderingPagesCount: PropTypes.number,
	};

	render() {
		const {
			headerColumns,
			stylesHeaderColumns,
			stylesRowColumns,
			selectable,
			marginTop,
			rowHeight,
			firstRowID,
			rowsPerPage,
			renderingPagesCount,
		} = this.props;

		const renderRowsCount = rowsPerPage * renderingPagesCount;

		let { rows } = this.props;

		let emptyRows = false;

		if (!rows) {
			emptyRows = true;
			const columnsCount = headerColumns.length;
			if (renderRowsCount) {
				rows = Array.from({ length: renderRowsCount })
				.map(() => Array.from({ length: columnsCount }));
			}
		}

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
				<TableHeader styleName="table-header" displaySelectAll={false}>
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
					className={tableBodyClass}>
					{
						rows ? rows.map((row, key) => (
							<TableRow
								selectable={selectable}
								key={key}
								className="row"
								data-id={key}
								style={{
									height: emptyRows ? rowHeight : null,
								}}>
								{
									row.map((column, i) => (
										<TableRowColumn
											key={i}
											style={stylesRowColumns ? {
												...rowColumnStyle,
												...stylesRowColumns[i],
											} || rowColumnStyle : rowColumnStyle}>
											{column || `${firstRowID + key}` || null}
										</TableRowColumn>
									))
								}
							</TableRow>
						)) : null
					}
				</TableBody>
			</Table>
		);
	}
}
