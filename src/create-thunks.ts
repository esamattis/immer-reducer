import {STATE, TYPES} from "./create-simple-actions";

export interface Thunk<State, ActionTypes> {
    (
        dispatch: (
            action: ActionTypes | Thunk<State, ActionTypes>,
        ) => Promise<null> | void,
        getState: () => State,
    ): any;
}

export function createThunks<
    State,
    ActionTypes,
    ThunkDict extends {
        [thunk: string]: (...args: any[]) => Thunk<State, ActionTypes>;
    }
>(
    options: {
        [STATE]: State;
        [TYPES]: ActionTypes;
    },
    thunks: ThunkDict,
) {
    return thunks;
}
