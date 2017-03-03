/* @flow */
import React, { Component, PropTypes } from 'react';
import CSSModules from 'react-css-modules';
import { connect } from 'react-redux';
import { fromEvents } from 'kefir';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import FontIcon from 'material-ui/FontIcon';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';
import Preloader from 'halogen/PacmanLoader';
import ErrorComponent from '../../components/Error';
import Button from '../../components/Button';
import ScrollArea from '../../containers/ScrollArea';
import { addUser, generateUsers, clear } from '../../actions/users';
import {
	fontFamily,
	primary1Color,
	primary2Color,
	accent1Color,
	buttonColor,
	textColor,
} from '../../styles/vars';
import styles from './index.css';

const muiTheme = getMuiTheme({
	fontFamily,
	palette: {
		primary1Color,
		primary2Color,
		accent1Color,
		pickerHeaderColor: primary1Color,
		textColor,
	},
});

const mapStateToProps = state => ({
	errorMessage: state.error.message,
	users: state.users.data,
	addButtonState: state.users.addButtonState,
	pendingDelete: state.users.pendingDelete,
	pendingGenerate: state.users.pendingGenerate,
	progressGenerate: state.users.progressGenerate,
});

@connect(mapStateToProps, { addUser, generateUsers, clear })
@CSSModules(styles)
export default class General extends Component {
	/* eslint-disable react/sort-comp */
	state: {
		smallWidth: boolean;
		smallTable: boolean;
		deleteDialogShow: boolean;
		generateDialogShow: boolean;
	};

	constructor(...args: Array<*>) {
		super(...args);
		this.state = {
			smallWidth: false,
			smallTable: false,
			deleteDialogShow: false,
			generateDialogShow: false,
		};
	}

	static propTypes = {
		errorMessage: PropTypes.string,
		connectServer: PropTypes.func,
	};
	/* eslint-enable react/sort-comp */

	componentDidMount() {
		this.widthHandler();
		fromEvents(window, 'resize')
		.debounce(20)
		.onValue(() => {
			this.widthHandler();
		});
	}

	getViewportWidth(): number {
		let documentHeight = 0;
		if (document.documentElement) {
			documentHeight = document.documentElement.clientWidth;
		}
		return Math.max(documentHeight, window.innerWidth || 0);
	}

	widthHandler = () => {
		const width = this.getViewportWidth();
		if (width <= 600 && !this.state.smallWidth) {
			this.setState({
				smallWidth: true,
			});
		}
		if (width > 600 && this.state.smallWidth) {
			this.setState({
				smallWidth: false,
			});
		}
		if (width <= 1530 && !this.state.smallTable) {
			this.setState({
				smallTable: true,
			});
		}
		if (width > 1525 && this.state.smallTable) {
			this.setState({
				smallTable: false,
			});
		}
	}

	deleteDialogShow = () => {
		this.setState({
			deleteDialogShow: true,
		});
	}

	generateDialogShow = () => {
		this.setState({
			generateDialogShow: true,
		});
	}

	deleteDialogHide = () => {
		this.setState({
			deleteDialogShow: false,
		});
	}

	generateDialogHide = () => {
		this.setState({
			generateDialogShow: false,
		});
	}

	render() {
		const {
			errorMessage,
			addButtonState,
			pendingDelete,
			pendingGenerate,
			progressGenerate,
		} = this.props;
		const { smallWidth, smallTable } = this.state;

		const deleteActions = [
			<FlatButton
				label="Отмена"
				primary
				onTouchTap={this.deleteDialogHide}
				/>,
			<FlatButton
				label="Удалить"
				primary
				keyboardFocused
				onTouchTap={() => {
					this.deleteDialogHide();
					this.props.clear();
				}}
				/>,
		];

		const generateActions = [
			<FlatButton
				label="Отмена"
				primary
				onTouchTap={this.generateDialogHide}
				/>,
			<FlatButton
				label="Сгенерировать"
				primary
				keyboardFocused
				onTouchTap={() => {
					this.generateDialogHide();
					this.props.generateUsers();
				}}
				/>,
		];

		return (
			<MuiThemeProvider muiTheme={muiTheme}>
				<div styleName="container">
					<div styleName="buttons-container">
						<Button
							onClick={this.props.addUser}
							state={addButtonState}
							className={smallWidth ? styles.smallButton : null}>
							{ smallWidth
								? <FontIcon className="material-icons" color="#fff">add</FontIcon>
								: 'Добавить'}
						</Button>
						<Button
							onClick={this.generateDialogShow}
							className={smallWidth ? styles.smallButton : null}>
							{ smallWidth
								? <FontIcon className="material-icons" color="#fff">delete_sweep</FontIcon>
								: 'Сгенерировать'}
						</Button>
						<Button
							onClick={this.deleteDialogShow}
							className={smallWidth ? styles.smallButton : null}>
							{ smallWidth
								? <FontIcon className="material-icons" color="#fff">playlist_add</FontIcon>
								: 'Очистить' }
						</Button>
					</div>
					<ScrollArea
						headerColumns={[
							'Имя и фамилия',
							'Примечание',
							'Номер телефона',
							'Дата и время связи',
							'Таймзона клиента',
							'Время у клиента',
							'Булевый признак 1',
						]}
						rows={this.props.users}
						stylesRowColumns={[
							{
								width: 180,
							},
							{
								width: smallTable ? 200 : 300,
							},
							{
								width: 150,
							},
							{
								width: 180,
								overflow: 'hidden',
							},
							{
								width: smallTable ? 250 : 350,
							},
							{
								overflow: 'hidden',
								width: 175,
							},
							{
								width: 185,
							},
						]}
						stylesHeaderColumns={[
							{
								width: 180,
							},
							{
								width: smallTable ? 200 : 300,
							},
							{
								width: 150,
							},
							{
								width: 180,
							},
							{
								width: smallTable ? 250 : 350,
							},
							{
								width: 175,
							},
							{
								width: 185,
							},
						]}
						/>
					<Dialog
						title="Удалить пользователей?"
						actions={deleteActions}
						modal={false}
						open={this.state.deleteDialogShow}
						onRequestClose={this.deleteDialogHide}>
						Вы действительно хотите удалить всех пользователей?
					</Dialog>
					<Dialog
						title="Сгенерировать пользователей?"
						actions={generateActions}
						modal={false}
						open={this.state.generateDialogShow}
						onRequestClose={this.generateDialogHide}>
						Будет сгенерировано 1 * 10<sup>6</sup> пользователей.
						<b> Все текущие пользователи будут удалены.</b>
						<span> Это может занять продолжительное время.</span>
						<span> Убедитесь, что у Вас достаточно места на диске.</span>
						<span> Вы действительно хотите сгенерировать пользователей?</span>
					</Dialog>
					{pendingDelete ? (
						<div styleName="loadingContainer">
							<b style={{ marginBottom: 10 }}>
								Идет удаление пользователей. Это может занять продолжительное время.
							</b>
							<Preloader color={buttonColor} />
						</div>
					) : null}
					{pendingGenerate ? (
						<div styleName="loadingContainer">
							<b style={{ marginBottom: 10 }}>
								Идет генерация пользователей. Это может занять продолжительное время.
							</b>
							<b style={{ marginBottom: 5 }}>{progressGenerate}%</b>
							<div style={{ width: 320, height: 5, background: '#fff' }}>
								<div
									style={{
										height: '100%',
										width: 320 / 100 * progressGenerate,
										background: buttonColor,
									}}
									/>
							</div>
						</div>
					) : null}
					<ErrorComponent message={errorMessage} />
				</div>
			</MuiThemeProvider>
		);
	}
}
