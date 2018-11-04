import {makeThunkCreator} from "../src/create-thunks";

import {configureStore} from "../src/configure-store";
import {ImmerReducer} from "../src/immer-reducer";
import {createReducerFunction, createActionCreators} from "../src";

const wait = (t: number) => new Promise(r => setTimeout(r, t));

test("thunks work", () => {
    const initialState = {foo: "bar"};

    class FooImmerReducer extends ImmerReducer<typeof initialState> {
        setFoo(action: {foo: string}) {
            this.draftState.foo = action.foo;
        }
    }

    const FooActionCreators = createActionCreators(FooImmerReducer);

    const createThunk = makeThunkCreator(store => ({
        getState: () => store.getState() as typeof initialState,
        dispatch: store.dispatch,
    }));

    const myThunk = createThunk((foo: number, bar: string) => store => {
        store.dispatch(
            FooActionCreators.setFoo({foo: "from thunk " + foo + bar}),
        );

        // just type testing
        const fromStoreFoo: string = store.getState().foo;
    });

    const store = configureStore({
        reducer: createReducerFunction(FooImmerReducer),
        preloadedState: initialState,
    });

    const ret = myThunk(3, "more");

    store.dispatch(ret);

    expect(store.getState()).toEqual({foo: "from thunk 3more"});
});

test("thunks can call other thunks", async () => {
    const initialState = {foo: "bar"};
    const thunkSpy = jest.fn();

    class FooImmerReducer extends ImmerReducer<typeof initialState> {
        setFoo(action: {foo: string}) {
            this.draftState.foo = action.foo;
        }
    }

    const FooActionCreators = createActionCreators(FooImmerReducer);

    const createThunk = makeThunkCreator(store => ({
        dispatch: store.dispatch,
    }));

    const myThunk = createThunk((boo: number) => {
        return async store => {
            store.dispatch(FooActionCreators.setFoo({foo: "first"}));
            thunkSpy();
            await store.dispatch(slowThunk());
        };
    });

    const slowThunk = createThunk(() => {
        return async store => {
            await wait(50);
            thunkSpy();
            store.dispatch(FooActionCreators.setFoo({foo: "slow"}));
        };
    });

    const store = configureStore({
        reducer: createReducerFunction(FooImmerReducer),
        preloadedState: initialState,
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

    class FooImmerReducer extends ImmerReducer<typeof initialState> {
        simple(action: {foo: string}) {
            this.draftState.foo = action.foo;
        }
    }

    const FooActionCreators = createActionCreators(FooImmerReducer);

    const createThunk = makeThunkCreator(store => ({
        dispatch: store.dispatch,
    }));

    const aThunk = createThunk(() => store => {
        store.dispatch(FooActionCreators.simple({foo: "slow"}));

        return "str";
    });

    const asyncThunk = createThunk(() => async store => {
        await wait(1);

        return 3;
    });

    const testThunk = createThunk(() => {
        return async store => {
            const simpleRet: void = store.dispatch(
                FooActionCreators.simple({foo: "dsf"}),
            );
            expect(simpleRet).toBe(undefined);

            const thunkDispatchRet: string = store.dispatch(aThunk());
            expect(thunkDispatchRet).toBe("str");

            const asyncDispatchRet: Promise<number> = store.dispatch(
                asyncThunk(),
            );

            const value: number = await asyncDispatchRet;
            expect(value).toBe(3);

            expect(typeof asyncDispatchRet.then).toBe("function");

            thunkSpy();
        };
    });

    const store = configureStore({
        reducer: createReducerFunction(FooImmerReducer),
        preloadedState: initialState,
    });

    store.dispatch(testThunk());
    await wait(10);
    expect(thunkSpy).toHaveBeenCalledTimes(1);
});
