import {createStore} from "redux";
import {createRedutser} from "../src/redutser-fork/redutser";

test("can create reducers", () => {
    const initialState = {foo: "bar"};

    const foo = createRedutser(initialState, {
        setFoo(state, action: {foo: string}) {
            return {...state, foo: action.foo};
        },
    });

    const store = createStore(foo.reducer);

    store.dispatch(foo.creators.setFoo({foo: "next"}));

    expect(store.getState()).toEqual({foo: "next"});
});
