import {makeThunkCreator} from "../src/create-thunks";

import {createSimpleActions, createReducer} from "../src/create-simple-actions";
import {configureStore} from "../src/configure-store";

const wait = (t: number) => new Promise(r => setTimeout(r, t));

test("thunks work", () => {
    const initialState = {foo: "bar"};

    const SimpleActions = createSimpleActions(initialState, {
        setFoo(state, action: {foo: string}) {
            return {...state, foo: action.foo};
        },
    });

    const createThunk = makeThunkCreator(store => ({
        heh: () => store.getState() as typeof initialState,
        ding: store.dispatch,
    }));

    const myThunk = createThunk((foo: number, bar: string) => wot => {
        wot.ding(SimpleActions.setFoo({foo: "from thunk " + foo + bar}));

        // just type testing
        const fromStoreFoo: string = wot.heh().foo;
    });

    const store = configureStore({
        reducer: createReducer(SimpleActions),
    });

    const ret = myThunk(3, "more");

    store.dispatch(ret);

    expect(store.getState()).toEqual({foo: "from thunk 3more"});
});

test("thunks can call other thunks", async () => {
    const initialState = {foo: "bar"};
    const thunkSpy = jest.fn();

    const SimpleActions = createSimpleActions(initialState, {
        setFoo(state, action: {foo: string}) {
            return {...state, foo: action.foo};
        },
    });

    const createThunk = makeThunkCreator(store => ({
        heh: store.getState,
        lol: store.dispatch,
    }));

    const myThunk = createThunk((boo: number) => {
        return async store => {
            store.lol(SimpleActions.setFoo({foo: "first"}));
            thunkSpy();
            await store.lol(slowThunk());
        };
    });

    const slowThunk = createThunk(() => {
        return async store => {
            await wait(50);
            thunkSpy();
            store.lol(SimpleActions.setFoo({foo: "slow"}));
        };
    });

    const store = configureStore({
        reducer: createReducer(SimpleActions),
    });
    store.dispatch(myThunk(3));

    expect(thunkSpy).toHaveBeenCalledTimes(1);
    expect(store.getState()).toEqual({foo: "first"});

    await wait(100);

    expect(thunkSpy).toHaveBeenCalledTimes(2);
    expect(store.getState()).toEqual({foo: "slow"});
});

test("thunk dispatch returns correct types", async () => {
    const initialState = {foo: "bar"};
    const thunkSpy = jest.fn();

    const SimpleActions = createSimpleActions(initialState, {
        simple(state, action: {foo: string}) {
            return {...state, foo: action.foo};
        },
    });

    const createThunk = makeThunkCreator(store => ({
        dispatch: store.dispatch,
    }));

    const aThunk = createThunk(() => {
        return store => {
            store.dispatch(SimpleActions.simple({foo: "slow"}));
        };
    });

    const asyncThunk = createThunk(() => {
        return async store => {
            await wait(1);
        };
    });

    const testThunk = createThunk(() => {
        return async store => {
            const simpleRet: void = store.dispatch(
                SimpleActions.simple({foo: "dsf"}),
            );

            const thunkRet: void = store.dispatch(aThunk());
            const thunkRet2 = store.dispatch(aThunk());

            const asyncRet: Promise<void> = store.dispatch(asyncThunk());
            const asyncRet2 = store.dispatch(asyncThunk());

            thunkSpy();
        };
    });

    const store = configureStore({
        reducer: createReducer(SimpleActions),
    });

    store.dispatch(testThunk());
    await wait(10);
    expect(thunkSpy).toHaveBeenCalledTimes(1);
});
