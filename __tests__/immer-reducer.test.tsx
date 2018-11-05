import {
    ImmerReducer,
    createReducerFunction,
    createActionCreators,
} from "../src/immer-reducer";

import {createStore, combineReducers} from "redux";

test("can create reducers", () => {
    const initialState = {foo: "bar"};

    class TestReducer extends ImmerReducer<typeof initialState> {
        setFoo(foo: string) {
            this.draftState.foo = foo;
        }
    }

    const reducer = createReducerFunction(TestReducer);
    const store = createStore(reducer, initialState);

    expect(store.getState()).toEqual({foo: "bar"});
});

test("the reducer can return the initial state", () => {
    const initialState = {foo: "bar"};

    class TestReducer extends ImmerReducer<typeof initialState> {
        setFoo(foo: string) {
            this.draftState.foo = foo;
        }
    }

    const reducer = createReducerFunction(TestReducer, initialState);
    const store = createStore(reducer);

    expect(store.getState()).toEqual({foo: "bar"});
});

test("can dispatch actions", () => {
    const initialState = {foo: "bar"};

    class TestReducer extends ImmerReducer<typeof initialState> {
        noop() {}
    }

    const ActionCreators = createActionCreators(TestReducer);
    const reducer = createReducerFunction(TestReducer);
    const store = createStore(reducer, initialState);

    store.dispatch(ActionCreators.noop());

    expect(store.getState()).toEqual({foo: "bar"});
});

test("can update state", () => {
    const initialState = {foo: "bar"};

    class TestReducer extends ImmerReducer<typeof initialState> {
        setFoo(foo: string) {
            this.draftState.foo = foo;
        }
    }

    const ActionCreators = createActionCreators(TestReducer);
    const reducer = createReducerFunction(TestReducer);
    const store = createStore(reducer, initialState);

    store.dispatch(ActionCreators.setFoo("next"));

    expect(store.getState()).toEqual({foo: "next"});
});

test("can update state using mutiple methods", () => {
    const initialState = {foo: "bar", bar: 1};

    class TestReducer extends ImmerReducer<typeof initialState> {
        setFoo(foo: string) {
            this.draftState.foo = foo;
        }

        setBar(bar: number) {
            this.draftState.bar = bar;
        }

        setBoth(foo: string, bar: number) {
            this.setFoo(foo);
            this.setBar(bar);
        }
    }

    const ActionCreators = createActionCreators(TestReducer);
    const reducer = createReducerFunction(TestReducer);
    const store = createStore(reducer, initialState);

    store.dispatch(ActionCreators.setBoth("next", 2));

    expect(store.getState()).toEqual({foo: "next", bar: 2});
});

test("the actual action type name is prefixed", () => {
    const initialState = {foo: "bar"};

    class TestReducer extends ImmerReducer<typeof initialState> {
        setFoo(foo: string) {
            this.draftState.foo = foo;
        }
    }

    const ActionCreators = createActionCreators(TestReducer);

    const reducer = createReducerFunction(TestReducer);
    const reducerSpy: typeof reducer = jest.fn(reducer);

    const store = createStore(reducerSpy, initialState);

    store.dispatch(ActionCreators.setFoo("next"));

    expect(reducerSpy).toHaveBeenLastCalledWith(
        {foo: "bar"},
        {
            payload: ["next"],
            type: "IMMER_REDUCER:setFoo",
        },
    );
});

test("can add helpers to the class", () => {
    const initialState = {foo: 1, bar: 1};

    class Helper {
        state: typeof initialState;

        constructor(state: typeof initialState) {
            this.state = state;
        }

        getCombined() {
            return this.state.foo + this.state.bar;
        }
    }

    class TestReducer extends ImmerReducer<typeof initialState> {
        helper = new Helper(this.state);

        combineToBar() {
            this.draftState.bar = this.helper.getCombined();
        }
    }

    const ActionCreators = createActionCreators(TestReducer);
    const reducer = createReducerFunction(TestReducer);
    const store = createStore(reducer, initialState);

    store.dispatch(ActionCreators.combineToBar());

    expect(store.getState()).toEqual({foo: 1, bar: 2});
});

test("can use combineReducers", () => {
    interface State1 {
        foo: number;
    }

    interface State2 {
        bar: string;
    }

    class TestReducer1 extends ImmerReducer<State1> {
        setFoo(foo: number) {
            this.draftState.foo = foo;
        }
    }

    class TestReducer2 extends ImmerReducer<State2> {
        setBar(bar: string) {
            this.draftState.bar = bar;
        }
    }

    const ActionCreators1 = createActionCreators(TestReducer1);
    const ActionCreators2 = createActionCreators(TestReducer2);

    const slice1 = createReducerFunction(TestReducer1, {foo: 0});
    const slice2 = createReducerFunction(TestReducer2, {bar: ""});

    const combined = combineReducers({slice1, slice2});

    const store = createStore(combined);

    store.dispatch(ActionCreators1.setFoo(1));
    store.dispatch(ActionCreators2.setBar("barval"));

    const state: {
        slice1: State1;
        slice2: State2;
    } = store.getState();

    expect(state).toEqual({slice1: {foo: 1}, slice2: {bar: "barval"}});
});
