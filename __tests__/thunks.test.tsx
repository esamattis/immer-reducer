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
        heh: store.getState,
        ding: store.dispatch,
    }));

    const myThunk = createThunk((foo: number, bar: string) => wot => {
        wot.ding(SimpleActions.setFoo({foo: "from thunk " + foo + bar}));
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
