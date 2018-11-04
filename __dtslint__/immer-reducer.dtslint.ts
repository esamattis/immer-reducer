import {
    ImmerReducer,
    createActionCreators,
    createReducerFunction,
    ImmerReducerClass,
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

const action: {
    type: "setBar";
    payload: [number];
} = ActionCreators.setBar(3);

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

const newState: State = reducer(
    {foo: "sdf", bar: 2},
    {
        type: "setBar",
        payload: [3],
    },
);

// $ExpectError
reducer({foo: "sdf", bar: 2}, {});

reducer(
    {foo: "sdf", bar: 2},
    // $ExpectError
    {
        type: "setBar",
        payload: ["bad"],
    },
);

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
    setDing(dong: string) {}
}

const OtherActionCreators = createActionCreators(OtherReducer);

OtherActionCreators.setDing("sdf");

// $ExpectError
reducer({foo: "sdf", bar: 2}, OtherActionCreators.setDing("sdf"));
