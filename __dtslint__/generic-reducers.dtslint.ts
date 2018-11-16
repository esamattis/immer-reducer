import {
    ImmerReducer,
    createReducerFunction,
    createActionCreators,
    ImmerReducerState,
} from "../src/immer-reducer";

interface AssignFail {
    ___: "it should not be possible to assign to me";
}

interface State {
    foo: {
        fooField1: string;
        fooField2: number;
    };

    bar: {
        barField1: number[];
        barField2: RegExp;
    };
}

const initialState: State = {
    foo: {
        fooField1: "a",
        fooField2: 1,
    },
    bar: {
        barField1: [1, 2],
        barField2: /re/,
    },
};

function createGenericReducer<T extends {[key: string]: unknown}>() {
    return class GenericReducer extends ImmerReducer<T> {
        set(part: Partial<T>) {
            Object.assign(this.draftState, part);
        }
    };
}
const ReducerClassFoo = createGenericReducer<State["foo"]>();
const ReducerClassBar = createGenericReducer<State["bar"]>();

////////////////////
// Instance tests //
////////////////////

const ins = new ReducerClassFoo(initialState.foo, initialState.foo);

const state_test_1: State["foo"] = ins.state;
const state_test_2: State["foo"] = ins.draftState;

// cannot assign to wrong state (ie. was not any)
// $ExpectError
const state_test_3: AssignFail = ins.state;
// $ExpectError
const state_test_4: AssignFail = ins.draftState;

//////////////////////////
// Action Creator tests //
//////////////////////////

const ActionCreatorsFoo = createActionCreators(ReducerClassFoo);
const ActionCreatorsBar = createActionCreators(ReducerClassBar);

ActionCreatorsFoo.set({fooField1: "b"});
ActionCreatorsFoo.set({fooField2: 2});

ActionCreatorsBar.set({barField1: [8]});
ActionCreatorsBar.set({barField2: /ding/});

// Cannot set bad values
// $ExpectError
ActionCreatorsFoo.set({fooField1: 2});

// Cannot set unknown fields
// $ExpectError
ActionCreatorsFoo.set({bad: 2});

// Cannot set bar fields
// $ExpectError
ActionCreatorsFoo.set({barField1: [8]});

////////////////////////////
// Reducer function tests //
////////////////////////////

const reducerFoo = createReducerFunction(ReducerClassFoo, initialState.foo);

reducerFoo(initialState, ActionCreatorsFoo.set({fooField1: "c"}));

// no bad actions allowed
// $ExpectError
reducerFoo(initialState, {type: "BAD_ACTION"});

// XXX bug! :( State is any here. This should fail!
reducerFoo({bad: "state"}, ActionCreatorsFoo.set({fooField1: "c"}));

// For some reason ImmerReducerState cannot infer state
// from a generic class. Maybe this is a limitation in Typescript?

type InferredState = ImmerReducerState<typeof ReducerClassFoo>;
declare const inferredState: InferredState;

// XXX! Should fail too!
const anumber: AssignFail = inferredState;
