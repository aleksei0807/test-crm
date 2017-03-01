/* @flow */
import type { Action } from '../types/action';

export const ERROR = 'ERROR';

export const getErrorAction = (message: ?string) => ({
	type: ERROR,
	payload: {
		message,
	},
});

export function setError(message: ?string) {
	return (dispatch: (action: Action) => Action) => {
		dispatch(getErrorAction(message));
	};
}
