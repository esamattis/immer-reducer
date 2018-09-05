import React from "react";
import {Provider} from "react-redux";

import {createThunks} from "../src/create-thunks";
import {createSimpleActions, createReducer} from "../src/create-simple-actions";
import {configureStore} from "../src/configure-store";

const wait = (t: number) => new Promise(r => setTimeout(r, t));

test("can create reducers", () => {
    const initialState = {foo: "bar"};

    const SimpleActions = createSimpleActions(initialState, {
        setFoo(state, action: {foo: string}) {
            return {...state, foo: action.foo};
        },
    });

    const reducer = createReducer(SimpleActions);

    // just some type tests
    reducer(initialState, SimpleActions.setFoo({foo: "typetest"}));
    // this must fail
    // @ts-ignore
    reducer(initialState, {type: "setFoofail", payload: {foo: "test"}});
    // @ts-ignore
    reducer(initialState, {type: "setFoo", payload: {foo: "test"}});

    const store = configureStore({
        reducer,
    });

    store.dispatch(SimpleActions.setFoo({foo: "next"}));

    expect(store.getState()).toEqual({foo: "next"});
});

test("action type name", () => {
    const initialState = {foo: "bar"};

    const SimpleActions = createSimpleActions(initialState, {
        setFoo(state, action: {foo: string}) {
            return {...state, foo: action.foo};
        },
    });

    const reducer = jest.fn(createReducer(SimpleActions));

    const store = configureStore({
        reducer,
    });

    store.dispatch(SimpleActions.setFoo({foo: "next"}));

    expect(reducer).toHaveBeenLastCalledWith(
        {foo: "bar"},
        {
            payload: {foo: "next"},
            type: "SIMPLE_ACTION:setFoo",
        },
    );
});

test("allow custom action type name", () => {
    const initialState = {foo: "bar"};

    const SimpleActions = createSimpleActions(
        initialState,
        {
            setFoo(state, action: {foo: string}) {
                return {...state, foo: action.foo};
            },
        },
        {actionTypePrefix: "MY"},
    );

    const reducer = jest.fn(createReducer(SimpleActions));

    const store = configureStore({
        reducer,
    });

    store.dispatch(SimpleActions.setFoo({foo: "next"}));

    expect(reducer).toHaveBeenLastCalledWith(
        {foo: "bar"},
        {
            payload: {foo: "next"},
            type: "MY:setFoo",
        },
    );
});

test("reducers use immer", () => {
    const initialState = {nest: {foo: "initial"}};

    const SimpleActions = createSimpleActions(initialState, {
        setFoo(state, action: {foo: string}) {
            state.nest.foo = action.foo;
            return state;
        },
    });

    const store = configureStore({
        reducer: createReducer(SimpleActions),
    });

    store.dispatch(SimpleActions.setFoo({foo: "next"}));

    // no mutation
    expect(initialState.nest.foo).toEqual("initial");

    // state is updated
    expect(store.getState()).toEqual({nest: {foo: "next"}});
});

test("can disable immer", () => {
    const initialState = {nest: {foo: "initial"}};

    const SimpleActions = createSimpleActions(
        initialState,
        {
            setFoo(state, action: {foo: string}) {
                state.nest.foo = action.foo;
                return state;
            },
        },
        {immer: false},
    );

    const store = configureStore({
        reducer: createReducer(SimpleActions),
    });

    store.dispatch(SimpleActions.setFoo({foo: "next"}));

    // YES mutation!
    expect(initialState.nest).toBe(store.getState()!.nest);
});

test("can call other reducers", () => {
    const initialState = {foo: "bar"};

    const SimpleActions = createSimpleActions(initialState, {
        setFoo(state, action: {foo: string}) {
            return this.setBar(state, {bar: action.foo});
        },

        setBar(state, action: {bar: string}) {
            return {...state, foo: action.bar + "BAR"};
        },
    });

    const store = configureStore({
        reducer: createReducer(SimpleActions),
    });

    store.dispatch(SimpleActions.setFoo({foo: "next"}));

    expect(store.getState()).toEqual({foo: "nextBAR"});
});

test("thunks work", () => {
    const initialState = {foo: "bar"};

    const SimpleActions = createSimpleActions(initialState, {
        setFoo(state, action: {foo: string}) {
            return {...state, foo: action.foo};
        },
    });

    const Thunks = createThunks(SimpleActions, {
        myThunk(boo: number) {
            return async dispatch => {
                // assert return value here too
                const res: Promise<null> | void = dispatch(
                    SimpleActions.setFoo({foo: "from thunk"}),
                );

                // just for type assertions
                const fakeDispatch: typeof dispatch = (() => null) as any;

                // These must fail

                // @ts-ignore
                fakeDispatch({type: "setFoo", payload: {foo: "from thunk"}});

                // @ts-ignore
                fakeDispatch({});

                // @ts-ignore
                fakeDispatch();
            };
        },
    });

    const store = configureStore({
        reducer: createReducer(SimpleActions),
    });

    store.dispatch(Thunks.myThunk(3) as any);

    expect(store.getState()).toEqual({foo: "from thunk"});
});

test("thunks can call other thunks", async () => {
    const initialState = {foo: "bar"};
    const thunkSpy = jest.fn();

    const SimpleActions = createSimpleActions(initialState, {
        setFoo(state, action: {foo: string}) {
            return {...state, foo: action.foo};
        },
    });

    const Thunks = createThunks(SimpleActions, {
        myThunk(boo: number) {
            return async (dispatch, getState) => {
                dispatch(SimpleActions.setFoo({foo: "first"}));
                thunkSpy();
                await dispatch(this.slowThunk());
            };
        },

        slowThunk() {
            return async dispatch => {
                await wait(50);
                thunkSpy();
                dispatch(SimpleActions.setFoo({foo: "slow"}));
            };
        },
    });

    const store = configureStore({
        reducer: createReducer(SimpleActions),
    });
    store.dispatch(Thunks.myThunk(3));

    expect(thunkSpy).toHaveBeenCalledTimes(1);
    expect(store.getState()).toEqual({foo: "first"});

    await wait(100);

    expect(thunkSpy).toHaveBeenCalledTimes(2);
    expect(store.getState()).toEqual({foo: "slow"});
});

test("can assing store to provider (types)", () => {
    const store = configureStore({
        reducer: s => "sdf",
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

    const FooSimpleActions = createSimpleActions(initialState.foo, {
        setFoo(draftState, action: {foo: number}) {
            draftState.ding = action.foo;
            return draftState;
        },
    });

    const BarSimpleActions = createSimpleActions(initialState.bar, {
        setBar(draftState, action: {bar: number}) {
            draftState.dong = action.bar;
            return draftState;
        },
    });

    const fooReducer = createReducer(FooSimpleActions);
    const barReducer = createReducer(BarSimpleActions);

    const store = configureStore({
        preloadedState: initialState,
        reducer: (state, action: any) => {
            return {
                ...state,
                foo: fooReducer(state.foo, action),
                bar: barReducer(state.bar, action),
            };
        },
    });

    store.dispatch(FooSimpleActions.setFoo({foo: 6}));
    store.dispatch(BarSimpleActions.setBar({bar: 7}));

    expect(store.getState()).toEqual({
        bar: {dong: 7},
        foo: {ding: 6},
        other: "",
    });
});
