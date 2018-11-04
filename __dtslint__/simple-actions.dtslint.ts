import {createSimpleActions, createReducer, SIMPLE_ACTIONS_META} from "../src";

const initialState = {foo: "bar"};

const SimpleActions = createSimpleActions(initialState, {
    setFoo(state, action: {foo: string}) {
        return {...state, foo: action.foo};
    },

    usingDispatch(state, action: {foo: string}, dispatch) {
        state = dispatch(state, SimpleActions.setFoo({foo: "foo"}));

        return {...state, foo: action.foo};
    },
});

// $ExpectError
SimpleActions.usingDispatch({foo: /bad/});

// $ExpectError
SimpleActions.setFoo({foo: /bad/});

// $ExpectError
SimpleActions.setFoo({foo: /bad/});

// $ExpectError
SimpleActions.setFoo({foo: "bar", bad: 1});

const reducer = createReducer(SimpleActions);

reducer(initialState, SimpleActions.setFoo({foo: "sdf"}));

reducer(initialState, SimpleActions.usingDispatch({foo: "sdf"}));

// $ExpectError
reducer(initialState, {type: "setFoofail", payload: {foo: "test"}});

// $ExpectError
reducer(initialState, {type: "setFoo", payload: {foo: "test"}});

const DispatchingTypes = createSimpleActions(initialState, {
    setFoo(state, action: {foo: string}, dispatch) {
        // $ExpectError
        dispatch(234);

        // $ExpectError
        dispatch({type: "setFoo2", payload: {foo: "test"}});

        // $ExpectError
        dispatch({}, DispatchingTypes.setFoo2({foo: "other"}));

        // $ExpectError
        this.bad(state, action);

        // OK!
        state = dispatch(state, DispatchingTypes.setFoo2({foo: "other"}));

        return state;
    },

    setFoo2(state, action: {foo: string}) {
        return {...state, foo: action.foo + "2"};
    },
});
