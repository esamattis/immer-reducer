/**
 * Fork from https://github.com/wkrueger/redutser
 */

import produce from "immer";

export const SIMPLE_ACTIONS_META = Symbol("SIMPLE_ACTIONS_META");
export const NO_MANUAL = Symbol("NO_MANUAL");
const DEFAULT_PREFIX = "SIMPLE_ACTION";

type SecondArg<T> = T extends (x: any, y: infer V, ...args: any[]) => any
    ? V
    : never;
type Values<K> = K[keyof K];

export interface SimpleActionsObject<State> {
    [name: string]: (
        this: void,
        state: State,
        action: any,
        dispatch: (
            state: State,
            action: {
                [NO_MANUAL]: "do not create action objects manually";
            },
        ) => State,
    ) => State;
}

export interface SimpleActionsMeta<State, Actions> {
    [SIMPLE_ACTIONS_META]: {
        initialState: State;
        actions: Actions;
        prefix: string;
    };
}

export type ActionCreatorsFromSimpleActions<
    Actions extends SimpleActionsObject<any>
> = {
    [K in keyof Actions]: (
        payload: SecondArg<Actions[K]>,
    ) => {
        type: K;
        payload: SecondArg<Actions[K]>;

        // This makes it impossible to create actions objects manually
        [NO_MANUAL]: "do not create action objects manually";
    }
};

export type ActionTypesFromSimpleActions<
    Inp extends SimpleActionsObject<any>
> = ReturnType<Values<ActionCreatorsFromSimpleActions<Inp>>>;

interface CreateSimpleActionsOptions {
    /**
     * Set to false to disable Immer usage
     * https://github.com/mweststrate/immer
     */
    immer?: boolean;

    /**
     * action type prefix
     */
    actionTypePrefix?: string;
}

function removePrefix(actionType: string) {
    return actionType
        .split(":")
        .slice(1)
        .join(":");
}

export const createSimpleActions = <
    State,
    Actions extends SimpleActionsObject<State>
>(
    initialState: State,
    actions: Actions,
    options?: CreateSimpleActionsOptions,
) => {
    const meta: SimpleActionsMeta<State, Actions> = {
        [SIMPLE_ACTIONS_META]: {
            initialState,
            actions,
            prefix: options
                ? options.actionTypePrefix || DEFAULT_PREFIX
                : DEFAULT_PREFIX,
        },
    };

    const creators = createActionCreators(meta[SIMPLE_ACTIONS_META].prefix)(
        actions,
    );

    const out = Object.assign(creators, meta);

    // For some reason it seems that the Object.assing()
    // in react-native does not copy symbol based keys.
    out[SIMPLE_ACTIONS_META] = meta[SIMPLE_ACTIONS_META];

    return out;
};

function createActionCreators(prefix: string) {
    return <D extends SimpleActionsObject<any>>(
        dict: D,
    ): ActionCreatorsFromSimpleActions<D> => {
        return Object.keys(dict).reduce(
            (dict, name) => {
                dict[name] = (action: any) => ({
                    type: prefix + ":" + name,
                    payload: action,
                });

                return dict;
            },
            {} as any,
        ) as any;
    };
}

interface CreateReducerOptions {}

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
        const type = String(action.type);

        if (!type.startsWith(meta.prefix + ":")) {
            return state;
        }

        const actionFn = meta.actions[removePrefix(type)];

        if (!actionFn) {
            return state;
        }

        const dispatchSubaction = (
            draftState: State,
            action: {type: string; payload: unknown},
        ) => {
            const subaction = meta.actions[removePrefix(action.type)];
            return subaction(
                draftState as State,
                action.payload,
                dispatchSubaction as any,
            );
        };

        return produce(state, draftState => {
            return actionFn(
                draftState as State,
                action.payload,
                dispatchSubaction as any,
            );
        });
    };
}
