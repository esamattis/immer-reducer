# immer-reducer

Create Type-Safe Redux reducers using [Immer](https://github.com/mweststrate/immer) and Typescript!

Read an introductory [blog post here](https://medium.com/@esamatti/type-safe-boilerplate-free-redux-906844ec6325).

## Install

    npm install immer-reducer

## Motivation

Turn this

```ts
interface SetFirstNameAction {
    type: "SET_FIRST_NAME";
    firstName: string;
}

interface SetLastNameAction {
    type: "SET_LAST_NAME";
    lastName: string;
}

type Action = SetFirstNameAction | SetLastNameAction;

function reducer(action: Action, state: State): State {
    switch (action.type) {
        case "SET_FIRST_NAME":
            return {...state, firstName: action.firstName};
        case "SET_LAST_NAME":
            return {...state, lastName: action.lastName};
        default:
            return state;
    }
}
```

into this!

```ts
import {ImmerReducer} from "immer-reducer";

class MyImmerReducer extends ImmerReducer<State> {
    setFirstName(firstName: string) {
        this.draftState.firstName = firstName;
    }

    setLastName(lastName: string) {
        this.draftState.lastName = lastName;
    }
}
```

**Without losing the type-safety!**

## Usage

Generate Action Creators and the actual reducer function for Redux from the class with

```ts
import {createActionCreators, createReducerFunction} from "immer-reducer";

const ActionCreators = createActionCreators(MyImmerReducer);
const reducerFunction = createReducerFunction(MyImmerReducer);
```

and create the Redux store

```ts
import {createStore} from "redux";

const initialState = {
    firstName: "",
    lastName: "",
};

const store = createStore(reducerFunction, initialState);
```

Dispatch some actions

```ts
store.dispatch(ActionCreators.setFirstName("Charlie"));
store.dispatch(ActionCreators.setLastName("Brown"));

expect(store.getState().firstName).toEqual("Charlie");
expect(store.getState().lastName).toEqual("Brown");
```

## Typed Action Creators!

This library by no means requires you to use Typescript but it was written
specifically Typescript usage in mind because I was unable to find any other
libraries that make Redux usage both boilerplate free and 100% type safe.

The generated `ActionsTypes` object respect the types used in the class

```ts
const ActionCreators = createActionCreators(MyImmerReducer);

const action = ActionCreators.setFirstName("Charlie"); // OK

action.payload[0]; // string type

action.payload[1]; // Type error. Only one argument.
ActionCreators.setFirstName(1); // Type error
ActionCreators.setWAT("Charlie"); // Type error
```

The reducer function is also typed properly

```ts
const reducer = createReducerFunction(MyImmerReducer);

const initialState: State = {
    firstName: "",
    lastName: "",
};

reducer(initialState, ActionCreators.setFirstName("Charlie")); // OK
reducer(initialState, {type: "WAT"}); // Type error
reducer({wat: "bad state"}, ActionCreators.setFirstName("Charlie")); // Type error
```

## How

Under the hood the class is deconstructed to following actions:

```js
{
    type: "IMMER_REDUCER:MyImmerReducer#setFirstName",
    payload: ["Charlie"],
}
{
    type: "IMMER_REDUCER:MyImmerReducer#setLastName",
    payload: ["Brown"],
}
```

So the method names become the Redux Action Types and the method arguments
become the action payloads. The reducer function will then match these
actions against the class and calls the appropriate methods with the payload
array spread to the arguments. But do note that the action format is not part
of the public API so don't write any code relying on it. The actions are
handled by the generated reducer function.

The generated reducer function executes the methods inside the `produce()`
function of Immer enabling the terse mutatable style updates.

## Integrating with the Redux ecosystem

To integrate for example with the side effects libraries such as
[redux-observable](https://github.com/redux-observable/redux-observable/) and
[redux-saga](https://github.com/redux-saga/redux-saga), you can access the
generated action type using the `type` property of the action creator
function:

```ts
// Get the action name to subscribe to
const setFirstNameActionTypeName = ActionCreators.setFirstName.type;

// Get the action type to have a type safe Epic
type SetFirstNameAction = ReturnType<typeof ActionCreators.setFirstName>;

const setFirstNameEpic: Epic<SetFirstNameAction> = action$ =>
  action$
    .ofType(setFirstNameActionTypeName)
    .pipe(
      // action.payload - recognized as string
      map(action => action.payload[0].toUpperCase()),
      ...
    );
```

## Examples

Here's a more complete example with [redux-render-prop](https://github.com/epeli/redux-render-prop):

<https://github.com/epeli/typescript-redux-todoapp>
