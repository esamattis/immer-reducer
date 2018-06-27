import {
    ActionTypesFromSimpleActions,
    SimpleActionsObject,
    SimpleActionsMeta,
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
    Actions extends SimpleActionsObject<State>,
    ThunkActions extends {
        [thunk: string]: (
            ...args: any[]
        ) => Thunk<State, ActionTypesFromSimpleActions<Actions>>;
    }
>(options: SimpleActionsMeta<State, Actions>, thunks: ThunkActions) {
    return thunks;
}
