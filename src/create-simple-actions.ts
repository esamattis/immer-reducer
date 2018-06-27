/**
 * Fork from https://github.com/wkrueger/redutser
 */

import produce from "immer";

export const SIMPLE_ACTIONS_META = Symbol("SIMPLE_ACTIONS_META");

type SecondArg<T> = T extends (x: any, y: infer V) => any ? V : never;
type Values<K> = K[keyof K];

export interface SimpleActionsObject<State> {
    [name: string]: (
        this: SimpleActionsObject<State>,
        state: State,
        action: any,
    ) => State;
}

export interface SimpleActionsMeta<State, Actions> {
    [SIMPLE_ACTIONS_META]: {
        initialState: State;
        actions: Actions;
    };
}

export type ActionCreatorsFromSimpleActions<
    Actions extends SimpleActionsObject<any>
> = {
    [K in keyof Actions]: (
        payload: SecondArg<Actions[K]>,
    ) => {type: K; payload: SecondArg<Actions[K]>}
};

export type ActionTypesFromSimpleActions<
    Inp extends SimpleActionsObject<any>
> = ReturnType<Values<ActionCreatorsFromSimpleActions<Inp>>>;

export const createSimpleActions = <
    State,
    Actions extends SimpleActionsObject<State>
>(
    initialState: State,
    actions: Actions,
) => {
    const creators = createActionCreators()(actions);

    return Object.assign(creators, {
        [SIMPLE_ACTIONS_META]: {
            initialState,
            actions,
        },
    });
};

function createActionCreators() {
    return <D extends SimpleActionsObject<any>>(
        dict: D,
    ): ActionCreatorsFromSimpleActions<D> => {
        return Object.keys(dict).reduce(
            (out, name) => ({
                ...out,
                [name]: (i: any) => ({type: name, payload: i}),
            }),
            {},
        ) as any;
    };
}

interface CreateReducerOptions {
    /**
     * Set to false to disable Immer usage
     * https://github.com/mweststrate/immer
     */
    immer?: boolean;
}

/**
 * Create reducer function for Redux store
 *
 * @param actions actions object returned by createSimpleActions()
 */
export function createReducer<
    State,
    Actions extends SimpleActionsObject<State>
>(actions: SimpleActionsMeta<State, Actions>, options?: CreateReducerOptions) {
    const meta = actions[SIMPLE_ACTIONS_META];

    return function reducer(
        state = meta.initialState,
        action: ActionTypesFromSimpleActions<Actions>,
    ): State {
        const actionFn = meta.actions[action.type];
        if (!actionFn) {
            return state;
        }

        if (options && options.immer === false) {
            return actionFn.call(meta.actions, state, action.payload);
        }

        return produce(state, draftState => {
            return actionFn.call(meta.actions, draftState, action.payload);
        });
    };
}
