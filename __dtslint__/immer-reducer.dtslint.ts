import {Action, createStore, bindActionCreators} from "redux";

import {
    ImmerReducer,
    createActionCreators,
    createReducerFunction,
    isAction,
    Actions,
    isActionFrom,
} from "../src/immer-reducer";
import {Dispatch} from "react";
import React from "react";

interface AssertNotAny {
    ___: "it should not be possible to assign to me";
}

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

////////////////////
// Test action types
////////////////////

const ActionCreators = createActionCreators(MyReducer);

// Action creator return Action Object
const action: {
    type: "setBar";
    payload: number;
} = ActionCreators.setBar(3);

// the action creator does no return any
// $ExpectError
const is_not_any: AssertNotAny = ActionCreators.setBar(3);

// actions without payload
const staticAction = ActionCreators.setFooStatic();
const staticPayload: [] = staticAction.payload;

// Actions with multiple items in the payload
const bothAction = ActionCreators.setBoth("foo", 1);

const bothPayload: [string, number] = bothAction.payload;

// Only function properties are picked
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

//////////////////////
// Test reducer types
//////////////////////

class BadReducer {
    dong() {}
}

// Cannot create action creators from random classes
// $ExpectError
createActionCreators(BadReducer);

const reducer = createReducerFunction(MyReducer);

// can create with proper initial state
createReducerFunction(MyReducer, {foo: "", bar: 0});

// Bad state argument is not allowed
// $ExpectError
createReducerFunction(MyReducer, {bad: "state"});

const newState: State = reducer(
    {foo: "sdf", bar: 2},
    {
        type: "setBar",
        payload: 3,
    },
);

// reducer does not return any
// $ExpectError
const no_any_state: AssertNotAny = reducer(
    {foo: "f", bar: 2},
    {
        type: "setBar",
        payload: 3,
    },
);

// bad state for the reducer
reducer(
    // $ExpectError
    {foo: "sdf", bar: "should be number"},
    {
        type: "setBar",
        payload: 3,
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
        payload: "should be number here",
    },
);

// Bad action type
reducer(
    {foo: "sdf", bar: 2},
    {
        // $ExpectError
        type: "bad",
        payload: 3,
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

// Action creator provides action type
const actionType: "setBar" = ActionCreators.setBar.type;

// $ExpectError
const actionType_not_any: AssertNotAny = ActionCreators.setBar.type;

//////////////////////
// Test isAction types
//////////////////////

declare const unknownAction: {type: string};

if (isAction(unknownAction, ActionCreators.setBar)) {
    // $ExpectError
    const actione_not_any: AssertNotAny = unknownAction;

    const knownAction: {
        type: "setBar";
        payload: number;
    } = unknownAction;

    // $ExpectError
    const nope: string = unknownAction.payload;
}

/////////////////////////////
// Test Actions<> type helper
/////////////////////////////

class Reducer1 extends ImmerReducer<State> {
    setFoo(newFoo: string) {
        this.draftState.foo = newFoo;
    }

    setBar(newBar: number) {
        this.draftState.bar = newBar;
    }
}

type MyActions = Actions<typeof Reducer1>;

declare const someActions: MyActions;

// $ExpectError
const someActionsNotAny: AssertNotAny = someActions;

const someActionsTest:
    | {
          type: "setFoo";
          payload: string;
      }
    | {
          type: "setBar";
          payload: number;
      } = someActions;

type MyReducerActions = Actions<typeof Reducer1>;
declare const myReducerActions: MyReducerActions;

// $ExpectError
const actions_not_any: AssertNotAny = myReducerActions;

const actions_manual:
    | {
          type: "setFoo";
          payload: string;
      }
    | {
          type: "setBar";
          payload: number;
      } = myReducerActions;

//////////////////////////
// Test isActionFrom types
//////////////////////////

declare const someAction: Action;

const ActionCreators1 = createActionCreators(Reducer1);

if (isActionFrom(someAction, Reducer1)) {
    // $ExpectError
    const notany: AssertNotAny = someAction;

    const actions_manual:
        | {
              type: "setFoo";
              payload: string;
          }
        | {
              type: "setBar";
              payload: number;
          } = someAction;
}

test("Can work with bindActionCreators", () => {
    const initialState = {foo: ""};
    const store = createStore(s => initialState);

    class Reducer extends ImmerReducer<typeof initialState> {
        setFoo(foo: string) {}
    }

    const ActionCreators = createActionCreators(Reducer);

    const boundActionCreators = bindActionCreators(
        ActionCreators,
        store.dispatch,
    );
});

test("can use with React.useReducer()", () => {
    const initialState = {foo: ""};

    class Reducer extends ImmerReducer<typeof initialState> {
        setFoo(foo: string) {}
    }

    const ActionCreators = createActionCreators(Reducer);
    const reducerFuntion = createReducerFunction(Reducer);

    function Component1() {
        const [state, dispatch] = React.useReducer(
            reducerFuntion,
            initialState,
        );

        const callback = () => {
            dispatch(ActionCreators.setFoo("test"));

            // $ExpectError
            dispatch("bad");

            const foo: string = state.foo;

            // $ExpectError
            const bar: AssertNotAny = state.foo;
        };

        return null;
    }
});
