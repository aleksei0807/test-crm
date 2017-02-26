/* @flow */
import React, { Component, PropTypes } from 'react';
import CSSModules from 'react-css-modules';
import { connect } from 'react-redux';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import ErrorComponent from '../../components/Error';
import Button from '../../components/Button';
import ScrollArea from '../../containers/ScrollArea';
import { addUser } from '../../actions/users';
import {
	fontFamily,
	primary1Color,
	accent1Color,
	buttonColor,
	textColor,
} from '../../styles/vars';
import styles from './index.css';

const muiTheme = getMuiTheme({
	fontFamily,
	palette: {
		primary1Color,
		accent1Color,
		pickerHeaderColor: buttonColor,
		textColor,
	},
});

const mapStateToProps = state => ({
	errorMessage: state.error.message,
	users: state.users.users,
});

@connect(mapStateToProps, { addUser })
@CSSModules(styles)
export default class General extends Component {
	static propTypes = {
		errorMessage: PropTypes.string,
		connectServer: PropTypes.func,
	};

	render() {
		const { errorMessage } = this.props;

		return (
			<MuiThemeProvider muiTheme={muiTheme}>
				<div styleName="container">
					<div styleName="buttons-container">
						<Button onClick={this.props.addUser}>
							Добавить
						</Button>
						<Button>
							Сгенерировать
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
						/>
					<ErrorComponent message={errorMessage} />
				</div>
			</MuiThemeProvider>
		);
	}
}
