// Originally forked from https://github.com/markerikson/redux-starter-kit/blob/2f7f1e0dce166f25ae7ec70a6460587ddd0cef80/src/configureStore.js
// TODO typing suck here a bit
import {createStore, compose, applyMiddleware, Store} from "redux";

const anyWindow = window as any;
const composeWithDevTools =
    typeof window !== "undefined" &&
    anyWindow.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
        ? anyWindow.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
        : function() {
              if (arguments.length === 0) return undefined;
              if (typeof arguments[0] === "object") return compose;
              return compose.apply(null, arguments);
          };

/**
 * Our own redux-thunk implementation. It's so simple and there's
 * no need to add extra dependency for it.
 */
const thunkMiddleware = ({dispatch, getState}: Store) => (
    next: (action: any) => any,
) => (action: unknown) => {
    if (typeof action === "function") {
        return action(dispatch, getState);
    }

    return next(action);
};

export function getDefaultMiddleware() {
    return [thunkMiddleware];
}

interface MyReducer<State> {
    (state: State, action: any): State;
}

export function composeReducers<State>(
    ...reducers: (MyReducer<State> | undefined)[]
): MyReducer<State> {
    return (state: any, action: any) => {
        return (
            reducers.reduce((state, subReducer) => {
                if (typeof subReducer === "function") {
                    return subReducer(state, action);
                }

                return state;
            }, state) || state
        );
    };
}

export function configureStore<State>(options: {
    reducer?: MyReducer<State>;
    reducers?: (MyReducer<State>)[];
    middleware?: any[];
    devTools?: boolean;
    preloadedState?: State;
    enhancers?: any[];
}) {
    const {
        reducer,
        reducers,
        middleware = getDefaultMiddleware(),
        devTools = true,
        preloadedState,
        enhancers = [],
    } = options;

    const middlewareEnhancer = applyMiddleware(...middleware);

    const storeEnhancers = [middlewareEnhancer, ...enhancers];

    let finalCompose: any = devTools ? composeWithDevTools : compose;

    const composedEnhancer = finalCompose(...storeEnhancers);

    const composedReducer: any = composeReducers(reducer, ...(reducers || []));

    const store = createStore(
        composedReducer,
        preloadedState as any,
        composedEnhancer,
    );

    return store as {
        // Custom store type to allow thunks in dispatch
        dispatch: (action: {type: string} | ((...args: any[]) => any)) => any;
        getState: () => State;
        subscribe: Store["subscribe"];
        replaceReducer: Store["replaceReducer"];
    };
}
