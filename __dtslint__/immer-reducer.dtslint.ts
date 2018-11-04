import {
    ImmerReducer,
    createActionCreators,
    createReducerFunction,
} from "../src/immer-reducer";

interface State {
    readonly foo: string;
    readonly bar: number;
}

class MyReducer extends ImmerReducer<State> {
    setBoth(newFoo: string, newBar: number) {
        this.setBar(newBar);
        this.setFoo(newFoo);
    }

    setFoo(newFoo: string) {
        this.draftState.foo = newFoo;
    }

    setBar(newBar: number) {
        this.draftState.bar = newBar;
    }

    setFooStatic() {
        this.draftState.foo = "static";
    }
}

const ActionCreators = createActionCreators(MyReducer);

// Action creator return Action Object
const action: {
    type: "setBar";
    payload: [number];
} = ActionCreators.setBar(3);

// actions without payload
ActionCreators.setFooStatic();

// Actions with multiple items in the payload
ActionCreators.setBoth("foo", 1);

// Only function properties is picked
// $ExpectError
ActionCreators.draftState;
// $ExpectError
ActionCreators.state;

// Do not allow bad argument types
// $ExpectError
ActionCreators.setBar("sdf");

// Do not allow bad method names
// $ExpectError
ActionCreators.setBad(3);

class BadReducer {
    dong() {}
}

// Cannot create action creators from random classes
// $ExpectError
createActionCreators(BadReducer);

const reducer = createReducerFunction(MyReducer);

const newState: State | undefined = reducer(
    {foo: "sdf", bar: 2},
    {
        type: "setBar",
        payload: [3],
    },
);

// bad state for the reducer
reducer(
    // $ExpectError
    {foo: "sdf", bar: "should be number"},
    {
        type: "setBar",
        payload: [3],
    },
);

// Bad action object
// $ExpectError
reducer({foo: "sdf", bar: 2}, {});

// Bad payload type
reducer(
    {foo: "sdf", bar: 2},
    // $ExpectError
    {
        type: "setBar",
        payload: ["should be number here"],
    },
);

// Bad action type
reducer(
    {foo: "sdf", bar: 2},
    {
        // $ExpectError
        type: "bad",
        payload: [3],
    },
);

reducer({foo: "sdf", bar: 2}, ActionCreators.setBar(3));

class OtherReducer extends ImmerReducer<State> {
    setDing(dong: string) {
        this.draftState.foo = dong;
    }
}

const OtherActionCreators = createActionCreators(OtherReducer);

// Mixed reducer and action creators from different ImmerReducer classes
// $ExpectError
reducer({foo: "sdf", bar: 2}, OtherActionCreators.setDing("sdf"));
