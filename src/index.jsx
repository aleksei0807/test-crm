/* @flow */
import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import injectTapEventPlugin from 'react-tap-event-plugin';
import configureStore from './store/configureStore';
import App from './app';

injectTapEventPlugin();

const rootElement = document.getElementById('root');

const store = configureStore();

ReactDOM.render(
	<AppContainer><App store={store} /></AppContainer>,
	rootElement
);

if (module.hot && typeof module.hot.accept === 'function') {
	module.hot.accept('./app.jsx', () => {
		const NextApp = require('./app').default;

		ReactDOM.render(
			<AppContainer><NextApp store={store} /></AppContainer>,
			rootElement
		);
	});
}
