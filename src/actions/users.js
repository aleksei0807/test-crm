/* @flow */
/* eslint-disable no-underscore-dangle */
import Dexie from 'dexie';
import timezones from 'react-timezone/src/timezones.json';
import type { Action } from '../types/action';
import { getErrorAction } from './error';

export const SET_USER_COUNT = 'SET_USER_COUNT';
export const SET_SCROLL_POS = 'SET_SCROLL_POS';
export const SET_USERS_ROWS = 'SET_USERS_ROWS';

const usersStorage = new Dexie('users');
const settingsStorage = new Dexie('settings');

usersStorage.version(1).stores({
	users: '++id, name, description, phone, callDate, timezone, bool1',
});

settingsStorage.version(1).stores({
	settings: '&key, value',
});

usersStorage.open().catch(err => {
	console.error(err);
});
settingsStorage.open().catch(err => {
	console.error(err);
});

const zoneKeys = Object.keys(timezones);

export function init() {
	return async (dispatch: (action: Action) => Action) => {
		try {
			const len = await usersStorage.users.count();
			dispatch({
				type: SET_USER_COUNT,
				payload: {
					count: len || 0,
				},
			});

			const posObj = await settingsStorage.settings.get({
				key: 'scrollPos',
			});
			const pos = posObj.value;
			dispatch({
				type: SET_SCROLL_POS,
				payload: {
					pos: pos || 0,
				},
			});
		} catch (err) {
			dispatch({
				type: SET_SCROLL_POS,
				payload: {
					pos: 0,
				},
			});
		}
	};
}

export function addUser() {
	return async (dispatch: (action: Action) => Action, getState: Function) => {
		try {
			const userCount = getState().users.userCount;
			const date = new Date();
			const callDate = Math.floor(date.getTime() / 1000 / 60);
			await usersStorage.users.add({
				name: '',
				description: '',
				phone: '',
				callDate,
				timezone: 0,
				bool1: false,
			});
			dispatch({
				type: SET_USER_COUNT,
				payload: {
					count: userCount + 1,
				},
			});
		} catch (err) {
			dispatch(getErrorAction(`Не удалось добавить юзера: ${err.message}`));
		}
	};
}

function getRandNum(max: number): number {
	return Math.floor(max * Math.random());
}

function getRandPhone(): number {
	return +Array
	.from({ length: 7 })
	.map(() => getRandNum(9))
	.join('');
}

export function generateUsers() {
	return async (dispatch: (action: Action) => Action) => {
		try {
			await usersStorage.users.clear();
			dispatch({
				type: SET_USER_COUNT,
				payload: {
					count: 0,
				},
			});

			for (let i = 0; i < 10e5; i += 10000) {
				console.log(i);
				const genQueue = Array
				.from({ length: 10000 })
				.map((v, k) => {
					const randTimeOffset = Math.random() * 86000 * 1000 * 365;
					const date = new Date(Date.now() - randTimeOffset);
					const callDate = Math.floor(date.getTime() / 1000 / 60);
					const timezone = getRandNum(zoneKeys.length);
					return {
						name: 'Алексей Щурак',
						description: `${i + k}`,
						phone: getRandPhone(),
						callDate,
						timezone,
						bool1: Math.random() <= 0.5,
					};
				});
				await usersStorage.users.bulkAdd(genQueue);
			}
			const len = await usersStorage.users.count();
			dispatch({
				type: SET_USER_COUNT,
				payload: {
					count: len,
				},
			});
			console.log(`length: ${len}`);
		} catch (err) {
			dispatch(getErrorAction(`Не удалось сгенерировать данные: ${err.message}`));
		}
	};
}

export function clear() {
	return async (dispatch: (action: Action) => Action) => {
		try {
			await usersStorage.users.clear();
			dispatch({
				type: SET_USER_COUNT,
				payload: {
					count: 0,
				},
			});
			dispatch({
				type: SET_USERS_ROWS,
				payload: {
					users: null,
				},
			});
			console.log('clear');
		} catch (err) {
			dispatch(getErrorAction(`Не удалось удалить данные: ${err.message}.
			Попробуйте очистить indexedDB в настройках своего браузера или в консоли разработчика.
			(developer's way)`));
		}
	};
}

export function getUsers(firstUserID: number, count: number) {
	return async (dispatch: (action: Action) => Action) => {
		try {
			console.log('firstUserID', firstUserID, 'count', count);
			let queryLen = await usersStorage.users.count();
			if (count < queryLen) {
				queryLen = count;
			}
			usersStorage.users
				.orderBy('id')
				.reverse()
				.offset(firstUserID)
				.limit(queryLen)
				.toArray((users) => {
					dispatch({
						type: SET_USERS_ROWS,
						payload: {
							users,
							firstDataID: firstUserID,
						},
					});
				});
		} catch (err) {
			dispatch(getErrorAction(`Не удалось получить данные: ${err.message}.`));
		}
	};
}

export function setScrollPos(pos: number) {
	settingsStorage.settings.put({
		key: 'scrollPos',
		value: pos,
	});
}
