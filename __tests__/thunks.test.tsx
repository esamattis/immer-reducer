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
        getState: () => store.getState() as typeof initialState,
        dispatch: store.dispatch,
    }));

    const myThunk = createThunk((foo: number, bar: string) => store => {
        store.dispatch(SimpleActions.setFoo({foo: "from thunk " + foo + bar}));

        // just type testing
        const fromStoreFoo: string = store.getState().foo;
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
        dispatch: store.dispatch,
    }));

    const myThunk = createThunk((boo: number) => {
        return async store => {
            store.dispatch(SimpleActions.setFoo({foo: "first"}));
            thunkSpy();
            await store.dispatch(slowThunk());
        };
    });

    const slowThunk = createThunk(() => {
        return async store => {
            await wait(50);
            thunkSpy();
            store.dispatch(SimpleActions.setFoo({foo: "slow"}));
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

    const aThunk = createThunk(() => store => {
        store.dispatch(SimpleActions.simple({foo: "slow"}));
    });

    const asyncThunk = createThunk(() => async store => {
        await wait(1);
    });

    const testThunk = createThunk(() => {
        return async store => {
            const simpleRet: void = store.dispatch(
                SimpleActions.simple({foo: "dsf"}),
            );

            const thunkDispatchRet: void = store.dispatch(aThunk());
            expect(thunkDispatchRet).toBe(undefined);

            const asyncDispatchRet: Promise<void> = store.dispatch(
                asyncThunk(),
            );
            expect(typeof asyncDispatchRet.then).toBe("function");

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
