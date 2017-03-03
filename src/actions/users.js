/* @flow */
/* eslint-disable no-underscore-dangle */
import Dexie from 'dexie';
import moment from 'moment-timezone';
import timezones from 'react-timezone/src/timezones.json';
import type { Action } from '../types/action';
import { getErrorAction } from './error';

export const SET_USER_COUNT = 'SET_USER_COUNT';
export const SET_SCROLL_POS = 'SET_SCROLL_POS';
export const DATA_LODAING = 'DATA_LODAING';
export const SET_USERS_ROWS = 'SET_USERS_ROWS';
export const ADD_USER = 'ADD_USER';
export const ADD_USER_SUCCESS = 'ADD_USER_SUCCESS';
export const ADD_USER_ERROR = 'ADD_USER_ERROR';
export const CHANGE_USER = 'CHANGE_USER';
export const DELETE_USERS = 'CLEAR_USERS';
export const DELETE_USERS_SUCCESS = 'DELETE_USERS_SUCCESS';
export const DELETE_USERS_ERROR = 'DELETE_USERS_ERROR';
export const GENERATE_USERS = 'GENERATE_USERS';
export const GENERATE_USERS_PROGRESS = 'GENERATE_USERS_PROGRESS';
export const GENERATE_USERS_SUCCESS = 'GENERATE_USERS_SUCCESS';
export const GENERATE_USERS_ERROR = 'GENERATE_USERS_ERROR';

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
			dispatch({
				type: ADD_USER,
			});
			const userCount = getState().users.userCount;
			const date = new Date();
			const offset = moment.tz.zone(moment.tz.guess()).parse(date) * 60 * 1000;
			const callDate = Math.floor((date.getTime() + offset) / 60 / 1000);
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
			dispatch({
				type: ADD_USER_SUCCESS,
			});
		} catch (err) {
			dispatch({
				type: ADD_USER_ERROR,
			});
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
			dispatch({
				type: GENERATE_USERS,
			});
			await usersStorage.users.clear();
			dispatch({
				type: SET_USER_COUNT,
				payload: {
					count: 0,
				},
			});

			for (let i = 0; i < 10e5; i += 10000) {
				dispatch({
					type: GENERATE_USERS_PROGRESS,
					payload: {
						progress: i / 10000,
					},
				});
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
			dispatch({
				type: GENERATE_USERS_SUCCESS,
			});
		} catch (err) {
			dispatch({
				type: GENERATE_USERS_ERROR,
			});
			dispatch(getErrorAction(`Не удалось сгенерировать данные: ${err.message}`));
		}
	};
}

export function clear() {
	return async (dispatch: (action: Action) => Action) => {
		try {
			dispatch({
				type: DELETE_USERS,
			});
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
			dispatch({
				type: DELETE_USERS_SUCCESS,
			});
		} catch (err) {
			dispatch({
				type: DELETE_USERS_ERROR,
			});
			dispatch(getErrorAction(`Не удалось удалить данные: ${err.message}.
			Попробуйте очистить indexedDB в настройках своего браузера или в консоли разработчика.
			(developer's way)`));
		}
	};
}

export function getUsers(firstUserID: number, count: number) {
	return async (dispatch: (action: Action) => Action) => {
		try {
			if (count < 1) {
				return;
			}
			dispatch({
				type: DATA_LODAING,
			});
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

export function changeUser(relativeId: number, propName: string, value: any) {
	return (dispatch: (action: Action) => Action, getState: Function) => {
		const usersObj = getState().users;
		const firstDataID = usersObj.firstDataID;
		const prevUser = usersObj.data.get(relativeId);
		const userCount = usersObj.userCount;
		const newUser = { ...prevUser, ...{ [propName]: value } };
		dispatch({
			type: CHANGE_USER,
			payload: {
				relativeId,
				newUser,
			},
		});
		usersStorage.users.put({
			id: firstDataID + (userCount - relativeId),
			...newUser,
		});
	};
}
