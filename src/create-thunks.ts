export interface Thunk<State, ActionTypes> {
    (
        dispatch: (
            action: ActionTypes | Thunk<State, ActionTypes>,
        ) => Promise<null> | void,
        getState: () => State,
    ): any;
}

export function createThunks<State, Actions>(options: {
    initialState: State;
    types: Actions;
}) {
    return function inner<
        ThunkDict extends {
            [thunk: string]: (...args: any[]) => Thunk<State, Actions>;
        }
    >(thunks: ThunkDict) {
        return thunks;
    };
}
