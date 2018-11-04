import React from "react";
import {Provider} from "react-redux";

import {configureStore} from "../src/configure-store";
import {ImmerReducer} from "../lib/immer-reducer";
import {
    createReducerFunction,
    createActionCreators,
} from "../src/immer-reducer";

test("can assing store to provider (types)", () => {
    const store = configureStore({
        reducer: s => "sdf",
        preloadedState: "",
    });

    const app = (
        <Provider store={store}>
            <div />
        </Provider>
    );
});

test("can compose multiple reducers", () => {
    const initialState = {
        foo: "",
        bar: "",
    };

    const reducerSpy1 = jest.fn();
    const reducerSpy2 = jest.fn();

    const reducer1 = (
        state: typeof initialState,
        action: any,
    ): typeof initialState => {
        reducerSpy1();
        return {...state, foo: "reducer1"};
    };

    const reducer2 = (
        state: typeof initialState,
        action: any,
    ): typeof initialState => {
        reducerSpy2();
        return {...state, bar: "reducer2"};
    };

    const store = configureStore({
        reducers: [reducer1, reducer2],
        preloadedState: initialState,
    });

    expect(reducerSpy1).toHaveBeenCalledTimes(1);
    expect(reducerSpy2).toHaveBeenCalledTimes(1);
    expect(store.getState()).toEqual({bar: "reducer2", foo: "reducer1"});
});

test("can combine multiple simple action reducers", () => {
    const initialState = {foo: {ding: 1}, bar: {dong: 2}, other: ""};

    class FooImmerReducer extends ImmerReducer<typeof initialState["foo"]> {
        setFoo(action: {foo: number}) {
            this.draftState.ding = action.foo;
        }
    }

    class BarImmerReducer extends ImmerReducer<typeof initialState["bar"]> {
        setBar(action: {bar: number}) {
            this.draftState.dong = action.bar;
        }
    }

    const fooReducer = createReducerFunction(FooImmerReducer);
    const barReducer = createReducerFunction(BarImmerReducer);

    const store = configureStore({
        preloadedState: initialState,
        reducer: (state, action: any) => {
            return {
                ...state,
                foo: fooReducer(state.foo, action) || initialState.foo,
                bar: barReducer(state.bar, action) || initialState.bar,
            };
        },
    });

    const FooActionCreators = createActionCreators(FooImmerReducer);
    const BarActionCreators = createActionCreators(BarImmerReducer);

    store.dispatch(FooActionCreators.setFoo({foo: 6}));
    store.dispatch(BarActionCreators.setBar({bar: 7}));

    expect(store.getState()).toEqual({
        bar: {dong: 7},
        foo: {ding: 6},
        other: "",
    });
});
