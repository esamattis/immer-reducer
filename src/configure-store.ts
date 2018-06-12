// Forked from https://github.com/markerikson/redux-starter-kit/blob/2f7f1e0dce166f25ae7ec70a6460587ddd0cef80/src/configureStore.js
// TODO typing suck here a bit
import {
    createStore,
    compose,
    applyMiddleware,
    Reducer,
    DeepPartial,
} from "redux";
import {composeWithDevTools} from "redux-devtools-extension";
import thunk from "redux-thunk";

export function getDefaultMiddleware() {
    return [thunk];
}

export function configureStore<State>(options: {
    reducer: Reducer<State, any>;
    middleware?: any[];
    devTools?: boolean;
    preloadedState?: DeepPartial<State>;
    enhancers?: any[];
}) {
    const {
        reducer,
        middleware = getDefaultMiddleware(),
        devTools = true,
        preloadedState,
        enhancers = [],
    } = options;

    const middlewareEnhancer = applyMiddleware(...middleware);

    const storeEnhancers = [middlewareEnhancer, ...enhancers];

    let finalCompose: any = devTools ? composeWithDevTools : compose;

    const composedEnhancer = finalCompose(...storeEnhancers);

    const store = createStore(reducer, preloadedState || {}, composedEnhancer);

    return store;
}
