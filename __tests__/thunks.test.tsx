import {createThunks} from "../src/create-thunks";

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
