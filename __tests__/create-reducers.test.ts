import {createThunks} from "../src/create-thunks";

import {createRedutser} from "../src/redutser-fork/redutser";
import {configureStore} from "../src/configure-store";

const wait = (t: number) => new Promise(r => setTimeout(r, t));

test("can create reducers", () => {
    const initialState = {foo: "bar"};

    const foo = createRedutser(initialState, {
        setFoo(state, action: {foo: string}) {
            return {...state, foo: action.foo};
        },
    });

    const store = configureStore({
        reducer: foo.reducer,
    });

    store.dispatch(foo.creators.setFoo({foo: "next"}));

    expect(store.getState()).toEqual({foo: "next"});
});

test("reducers use immer", () => {
    const initialState = {nest: {foo: "initial"}};

    const foo = createRedutser(initialState, {
        setFoo(state, action: {foo: string}) {
            console.log("state", state);
            state.nest.foo = action.foo;
            return state;
        },
    });

    const store = configureStore({
        reducer: foo.reducer,
    });

    store.dispatch(foo.creators.setFoo({foo: "next"}));

    // no mutation
    expect(initialState.nest.foo).toEqual("initial");

    // state is updated
    expect(store.getState()).toEqual({nest: {foo: "next"}});
});

test("can call other reducers", () => {
    const initialState = {foo: "bar"};

    const foo = createRedutser(initialState, {
        setFoo(state, action: {foo: string}) {
            return this.setBar(state, {bar: action.foo});
        },

        setBar(state, action: {bar: string}) {
            return {...state, foo: action.bar + "BAR"};
        },
    });

    const store = configureStore({
        reducer: foo.reducer,
    });

    store.dispatch(foo.creators.setFoo({foo: "next"}));

    expect(store.getState()).toEqual({foo: "nextBAR"});
});

test("thunks work", () => {
    const initialState = {foo: "bar"};

    const {creators, reducer, actionTypes} = createRedutser(initialState, {
        setFoo(state, action: {foo: string}) {
            return {...state, foo: action.foo};
        },
    });

    const Thunks = createThunks<typeof initialState, typeof actionTypes>()({
        myThunk(boo: number) {
            return async dispatch => {
                // assert return value here too
                const res: Promise<null> | void = dispatch(
                    creators.setFoo({foo: "from thunk"}),
                );
            };
        },
    });

    const store = configureStore({
        reducer: reducer,
    });

    store.dispatch(Thunks.myThunk(3) as any);

    expect(store.getState()).toEqual({foo: "from thunk"});
});

test("thunks can call other thunks", async () => {
    const initialState = {foo: "bar"};
    const thunkSpy = jest.fn();

    const {creators, reducer, actionTypes} = createRedutser(initialState, {
        setFoo(state, action: {foo: string}) {
            return {...state, foo: action.foo};
        },
    });

    const Thunks = createThunks<typeof initialState, typeof actionTypes>()({
        myThunk(boo: number) {
            return async (dispatch, getState) => {
                dispatch(creators.setFoo({foo: "first"}));
                thunkSpy();
                await dispatch(this.slowThunk());
            };
        },

        slowThunk() {
            return async dispatch => {
                await wait(50);
                thunkSpy();
                dispatch(creators.setFoo({foo: "slow"}));
            };
        },
    });

    const store = configureStore({
        reducer: reducer,
    });

    store.dispatch(Thunks.myThunk(3) as any);

    expect(thunkSpy).toHaveBeenCalledTimes(1);
    expect(store.getState()).toEqual({foo: "first"});

    await wait(100);

    expect(thunkSpy).toHaveBeenCalledTimes(2);
    expect(store.getState()).toEqual({foo: "slow"});
});
