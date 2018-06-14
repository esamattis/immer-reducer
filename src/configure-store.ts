// Forked from https://github.com/markerikson/redux-starter-kit/blob/2f7f1e0dce166f25ae7ec70a6460587ddd0cef80/src/configureStore.js
// TODO typing suck here a bit
import {createStore, compose, applyMiddleware, DeepPartial, Store} from "redux";
import thunk from "redux-thunk";

const {composeWithDevTools} = require("redux-devtools-extension");

export function getDefaultMiddleware() {
    return [thunk];
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
    preloadedState?: DeepPartial<State>;
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
