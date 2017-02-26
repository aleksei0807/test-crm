/* @flow */
import type { Action } from '../types/action';
import { SET_USER_COUNT, SET_SCROLL_POS, SET_USERS_ROWS } from '../actions/users';

const defaultState = {
	userCount: 0,
	scrollPos: 0,
	users: null,
};

export default function general(state: Object = defaultState, action: Action) {
	switch (action.type) {
	case SET_USER_COUNT: {
		if (action.payload) {
			return {
				...state,
				...{userCount: action.payload.count},
			};
		}
		return state;
	}
	case SET_SCROLL_POS: {
		if (action.payload) {
			return {
				...state,
				...{scrollPos: action.payload.pos},
			};
		}
		return state;
	}
	case SET_USERS_ROWS: {
		if (action.payload) {
			return {
				...state,
				...action.payload,
			};
		}
		return state;
	}
	default:
		return state;
	}
}
