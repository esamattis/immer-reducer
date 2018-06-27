import {
    META,
    ActionTypesFromReducerDict,
    ReducerDict,
} from "./create-simple-actions";

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
    Dict extends ReducerDict<State>,
    ThunkDict extends {
        [thunk: string]: (
            ...args: any[]
        ) => Thunk<State, ActionTypesFromReducerDict<Dict>>;
    }
>(
    options: {
        [META]: {
            initialState: State;
            reducerDict: Dict;
        };
    },
    thunks: ThunkDict,
) {
    return thunks;
}
