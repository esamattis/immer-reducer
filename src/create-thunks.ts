export interface Thunk<State, ActionTypes> {
    (
        dispatch: (
            action: ActionTypes | Thunk<State, ActionTypes>,
        ) => Promise<null> | void,
        getState: () => State,
    ): any;
}

export function createThunks<State, ActionTypes>(options: {
    initialState: State;
    types: ActionTypes;
}) {
    return function inner<
        ThunkDict extends {
            [thunk: string]: (...args: any[]) => Thunk<State, ActionTypes>;
        }
    >(thunks: ThunkDict) {
        return thunks;
    };
}
