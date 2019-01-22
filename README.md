# immer-reducer

Create terse Type-Safe Redux reducers using [Immer](https://github.com/mweststrate/immer) and Typescript!

Read an introductory [blog post here](https://medium.com/@esamatti/type-safe-boilerplate-free-redux-906844ec6325).

## Install

    npm install immer-reducer

## Motivation

Turn this 💩

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
            return {
                ...state,
                user: {
                    ...state.user,
                    firstName: action.firstName,
                },
            };
        case "SET_LAST_NAME":
            return {
                ...state,
                user: {
                    ...state.user,
                    lastName: action.lastName,
                },
            };
        default:
            return state;
    }
}
```

into this! 🚀

```ts
import {ImmerReducer} from "immer-reducer";

class MyImmerReducer extends ImmerReducer<State> {
    setFirstName(firstName: string) {
        this.draftState.user.firstName = firstName;
    }

    setLastName(lastName: string) {
        this.draftState.user.lastName = lastName;
    }
}
```

**Without losing the type-safety!** 🔥

Oh, and you get the action creators for free! 🤗 🎂

## Usage

Generate Action Creators and the actual reducer function for Redux from the class with

```ts
import {createStore} from "redux";
import {createActionCreators, createReducerFunction} from "immer-reducer";

const initialState: State = {
    user: {
        firstName: "",
        lastName: "",
    },
};

const ActionCreators = createActionCreators(MyImmerReducer);
const reducerFunction = createReducerFunction(MyImmerReducer, initialState);

const store = createStore(reducerFunction);
```

Dispatch some actions

```ts
store.dispatch(ActionCreators.setFirstName("Charlie"));
store.dispatch(ActionCreators.setLastName("Brown"));

expect(store.getState().user.firstName).toEqual("Charlie");
expect(store.getState().user.lastName).toEqual("Brown");
```

## Typed Action Creators!

This library by no means requires you to use Typescript but it was written
specifically Typescript usage in mind because I was unable to find any other
libraries that make Redux usage both terse and 100% type safe.

The generated `ActionsTypes` object respect the types used in the class

```ts
const action = ActionCreators.setFirstName("Charlie"); // OK
action.payload[0]; // OK string type

action.payload[1]; // Type error. Only one argument.
ActionCreators.setFirstName(1); // Type error. Needs string.
ActionCreators.setWAT("Charlie"); // Type error. Unknown method
```

The reducer function is also typed properly

```ts
const reducer = createReducerFunction(MyImmerReducer);

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
function.

In redux-observable

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

In redux-saga

```ts
function* watchFirstNameChanges() {
    yield takeEvery(ActionCreators.setFirstName.type, doStuff);
}

// or use the isActionFrom() to get all actions from a specific ImmerReducer
// action creators object
function* watchImmerActions() {
    yield takeEvery(
        (action: Action) => isActionFrom(action, ActionCreators),
        handleImmerReducerAction,
    );
}

function* handleImmerReducerAction(action: Actions<typeof MyImmerReducer>) {
    // `action` is a union of action types
    if (isAction(action, ActionCreators.setFirstName)) {
        // with action of setFirstName
    }
}
```

## Examples

Here's a more complete example with [redux-render-prop](https://github.com/epeli/redux-render-prop):

<https://github.com/epeli/typescript-redux-todoapp>

## Helpers

The module exports following helpers

### `function isActionFrom(action, actionCreators)`

Type guard for detecting if the given action is generated by the action
creators object. The detected type will be union of actions the class
generates.

Example

```ts
if (isActionFrom(someAction, ActionCreators)) {
    // someAction now has type of
    // {
    //     type: "setFirstName";
    //     payload: [string];
    // } | {
    //     type: "setLastName";
    //     payload: [string];
    // };
}
```

### `function isAction(action, actionCreator)`

Type guard for detecting specific actions generated by immer-reducer.

Example

```ts
if (isAction(someAction, ActionCreators.setFirstName)) {
    someAction.type; // Type checks to `"setFirstName"`
    someAction.payload; // Type checks `[string]`
}
```

### `type Actions<ImmerReducerClass>`

Get union of the action types generated by the ImmerReducer class

Example

```ts
type MyActions = Actions<typeof MyImmerReducer>;

// Is the same as
type MyActions =
    | {
          type: "setFirstName";
          payload: [string];
      }
    | {
          type: "setLastName";
          payload: [string];
      };
```

### `function setPrefix(prefix: string)`

The default prefix in the generated action types is `IMMER_REDUCER`. Call
this customize it for your app.

Example

```ts
setPrefix("MY_APP");
```
