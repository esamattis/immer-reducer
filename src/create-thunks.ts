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

/**
 * Create thunk actions for side effects etc.
 *
 * @param actions actions object returned by createSimpleActions()
 * @param thunks
 */
export function createThunks<
    State,
    Actions extends SimpleActionsObject<State>,
    ThunkActions extends {
        [thunk: string]: (
            ...args: any[]
        ) => Thunk<State, ActionTypesFromSimpleActions<Actions>>;
    }
>(actions: SimpleActionsMeta<State, Actions>, thunks: ThunkActions) {
    return thunks;
}
