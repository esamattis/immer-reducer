import {createSimpleActions, createReducer} from "../src";

const initialState = {foo: "bar"};

const SimpleActions = createSimpleActions(initialState, {
    setFoo(state, action: {foo: string}) {
        return {...state, foo: action.foo};
    },
});

const reducer = createReducer(SimpleActions);

// $ExpectError
reducer(initialState, SimpleActions.setFoo({foo: /bad/}));

// $ExpectError
reducer(initialState, SimpleActions.setFoo({foo: "bar", bad: 1}));
