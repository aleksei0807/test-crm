/* @flow */
import { List } from 'immutable';
import type { Action } from '../types/action';
import {
	SET_USER_COUNT,
	SET_SCROLL_POS,
	SET_USERS_ROWS,
	ADD_USER,
	ADD_USER_SUCCESS,
	ADD_USER_ERROR,
	CHANGE_USER,
	DATA_LODAING,
	DELETE_USERS,
	DELETE_USERS_SUCCESS,
	DELETE_USERS_ERROR,
	GENERATE_USERS,
	GENERATE_USERS_PROGRESS,
	GENERATE_USERS_SUCCESS,
	GENERATE_USERS_ERROR,
} from '../actions/users';



const defaultState = {
	userCount: 0,
	initScrollPos: null,
	firstDataID: null,
	addButtonState: '',
	data: null,
	pendingLoading: false,
	pendingDelete: false,
	pendingGenerate: false,
	progressGenerate: 0,
};

export default function general(state: Object = defaultState, action: Action) {
	switch (action.type) {
	case SET_USER_COUNT: {
		if (action.payload) {
			return {
				...state,
				...{ userCount: action.payload.count },
			};
		}
		return state;
	}
	case SET_SCROLL_POS: {
		if (action.payload) {
			return {
				...state,
				...{ initScrollPos: action.payload.pos },
			};
		}
		return state;
	}
	case DATA_LODAING:
		return { ...state, ...{ pendingLoading: true } };
	case SET_USERS_ROWS: {
		if (action.payload) {
			let data = null;
			if (action.payload.users) {
				data = List(action.payload.users);
			}
			return {
				...state,
				...{
					data,
					firstDataID: action.payload.firstDataID || 0,
					pendingLoading: false,
				},
			};
		}
		return state;
	}
	case ADD_USER:
		return { ...state, addButtonState: 'loading' };
	case ADD_USER_SUCCESS:
		return { ...state, addButtonState: 'success' };
	case ADD_USER_ERROR:
		return { ...state, addButtonState: 'error' };
	case CHANGE_USER: {
		if (action.payload && state.data) {
			const { relativeId, newUser } = action.payload;
			return { ...state, ...{ data: state.data.set(relativeId, newUser) } };
		}
		return state;
	}
	case DELETE_USERS:
		return { ...state, pendingDelete: true };
	case DELETE_USERS_SUCCESS:
		return { ...state, pendingDelete: false };
	case DELETE_USERS_ERROR:
		return { ...state, pendingDelete: false };
	case GENERATE_USERS:
		return { ...state, pendingGenerate: true };
	case GENERATE_USERS_PROGRESS: {
		if (action.payload) {
			return { ...state, ...{ progressGenerate: action.payload.progress } };
		}
		return state;
	}
	case GENERATE_USERS_SUCCESS:
		return { ...state, pendingGenerate: false };
	case GENERATE_USERS_ERROR:
		return { ...state, pendingGenerate: false };
	default:
		return state;
	}
}
