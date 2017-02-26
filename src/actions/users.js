/* @flow */
import localforage from 'localforage';
import type { Action } from '../types/action';

export const SET_USER_COUNT = 'SET_USER_COUNT';
export const SET_SCROLL_POS = 'SET_SCROLL_POS';
export const SET_USERS_ROWS = 'SET_USERS_ROWS';

const usersStorage = localforage.createInstance({
	name: 'users',
});
const settingsStorage = localforage.createInstance({
	name: 'settings',
});


export function init() {
	return (dispatch: (action: Action) => Action) => {
		usersStorage.length()
		.then((count) => {
			if (count === null) {
				return;
			}
			dispatch({
				type: SET_USER_COUNT,
				payload: {
					count,
				},
			});
			
			const usersRows = [];
			for (let i = count - 1; i >= 0; i--) {
				const value = usersStorage.getItem(`${i}`);
				usersRows.push(value);
			}
			Promise.all(usersRows).then(users => {
				dispatch({
					type: SET_USERS_ROWS,
					payload: {
						users,
					},
				});
			});
		})
		.catch((err) => {
			console.error(err);
		});

		settingsStorage.getItem('scrollPos')
		.then((pos) => {
			if (pos === null) {
				return;
			}
			dispatch({
				type: SET_SCROLL_POS,
				payload: {
					pos,
				},
			});
		})
		.catch((err) => {
			console.error(err);
		});
	};
}

export function addUser() {
	return (dispatch: (action: Action) => Action, getState: Function) => {
		const userCount = getState().users.userCount;
		usersStorage.setItem(userCount, [
			'Имя и фамилия',
			'Примечание',
			'Номер телефона',
			'Дата и время связи',
			'Таймзона клиента',
			'Время у клиента',
			'Булевый признак 1',
		])
		.then(value => {
			console.log(value);
			dispatch({
				type: SET_USER_COUNT,
				payload: {
					count: userCount + 1,
				},
			});
		})
		.catch((err) => {
			console.error(err);
		});
	};
}
