# immer-reducer

Create terse type-safe Redux reducers using [Immer](https://github.com/mweststrate/immer) and Typescript!

Read an introductory [blog post here](https://medium.com/@esamatti/type-safe-boilerplate-free-redux-906844ec6325).

## 📦 Install

    npm install immer-reducer

## 💪 Motivation

Turn this 💩 💩 💩

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

✨✨ Into this! ✨✨

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

🔥🔥 **Without losing type-safety!** 🔥🔥

Oh, and you get the action creators for free! 🤗 🎂

## 📖 Usage

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

## 🌟 Typed Action Creators!

The generated `ActionCreator` object respect the types used in the class

```ts
const action = ActionCreators.setFirstName("Charlie"); // OK
action.payload; // OK type string

ActionCreators.setFirstName(1); // Type error. Needs string.
ActionCreators.setWAT("Charlie"); // Type error. Unknown method
```

If the reducer class where to have a method which takes more than one argument
the payload would be array of the arguments

```ts
// setName(firstName: string, lastName: string) {}
const action = ActionCreators.setName("Charlie", "Brown");
action.payload; // will have value ["charlie", "brown"] and type [string, string]
```

The reducer function is also typed properly

```ts
const reducer = createReducerFunction(MyImmerReducer);

reducer(initialState, ActionCreators.setFirstName("Charlie")); // OK
reducer(initialState, {type: "WAT"}); // Type error
reducer({wat: "bad state"}, ActionCreators.setFirstName("Charlie")); // Type error
```

## 🤔 How

Under the hood the class is deconstructed to following actions:

```js
{
    type: "IMMER_REDUCER:MyImmerReducer#setFirstName",
    payload: "Charlie",
}
{
    type: "IMMER_REDUCER:MyImmerReducer#setLastName",
    payload: "Brown",
}
{
    type: "IMMER_REDUCER:MyImmerReducer#setName",
    payload: ["Charlie", "Brown"],
    args: true
}
```

So the class and method names become the Redux Action Types and the method
arguments become the action payloads. The reducer function will then match
these actions against the class and calls the appropriate methods with the
payload array spread to the arguments.

🚫 The format of the `action.type` string is internal to immer-reducer. If
you need to detect the actions use the provided type guards.

The generated reducer function executes the methods inside the `produce()`
function of Immer enabling the terse mutatable style updates.

## 🔄 Integrating with the Redux ecosystem

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
      map(action => action.payload.toUpperCase()),
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

## 📚 Examples

Here's a more complete example with [redux-render-prop](https://github.com/epeli/redux-render-prop):

<https://github.com/epeli/typescript-redux-todoapp>

## 📓 Helpers

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
    //     payload: string;
    // } | {
    //     type: "setLastName";
    //     payload: string;
    // };
}
```

### `function isAction(action, actionCreator)`

Type guard for detecting specific actions generated by immer-reducer.

Example

```ts
if (isAction(someAction, ActionCreators.setFirstName)) {
    someAction.payload; // Type checks to `string`
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
