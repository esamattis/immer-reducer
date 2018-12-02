# Immer Reducer

[![Greenkeeper badge](https://badges.greenkeeper.io/epeli/immer-reducer.svg)](https://greenkeeper.io/)

Create Redux reducers using [Immer](https://github.com/mweststrate/immer)!

Typescript [friendly](#100-type-safety-with-typescript) too.

Read an introductory [blog post here](https://medium.com/@esamatti/type-safe-boilerplate-free-redux-906844ec6325).

## Install

    npm install immer-reducer

## Usage

Reducers are defined by extending from the `ImmerReducer` class

```js
import {ImmerReducer} from "immer-reducer";

// The class represents the classic switch-case reducer
class MyImmerReducer extends ImmerReducer {
    // each method becomes an Action Creator
    setFirstName(firstName) {
        // State updates are simple as assigning a value to
        // the draftState property thanks to Immer
        this.draftState.firstName = firstName;
    }

    setLastName(lastName) {
        this.draftState.lastName = lastName;
    }

    // You can combine methods to a single Action Creator
    setName(firstName, lastName) {
        this.setFirstName(firstName);
        this.setLastName(lastName);
    }
}
```

Generate Action Creators and the actual reducer function for Redux

```js
import {createActionCreators, createReducerFunction} from "immer-reducer";

const ActionCreators = createActionCreators(MyImmerReducer);
const reducerFunction = createReducerFunction(MyImmerReducer);
```

and create the Redux store

```js
import {createStore} from "redux";

const initialState = {
    firstName: "",
    lastName: "",
};

const store = createStore(reducerFunction, initialState);
```

Dispatch some actions

```js
store.dispatch(ActionCreators.setFirstName("Charlie"));
store.dispatch(ActionCreators.setLastName("Brown"));

expect(store.getState().firstName).toEqual("Charlie");
expect(store.getState().lastName).toEqual("Brown");
```

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

# Integrating with the Redux ecosystem

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
      map(action => action.payload.toUpperCase()),
      ...
    );
```

# 100% Type Safety with Typescript

This library by no means requires you to use Typescript but it was written
specifically Typescript usage in mind because I was unable to find any other
libraries that make Redux usage both boilerplate free and 100% type safe. To
be honest it was no easy feat. Pretty advanced Typescript sorcery was
required and so this library requires Typescript 3.1 or later. But the end
results is really simple for the end user.

The Typescript usage does not differ that much from the Javascript usage.
Just pass your state type as the type argument for the class

```ts
interface State {
    // The state can be defined as read only
    readonly firstName: string;
    readonly lastName: string;
}

class MyImmerReducer extends ImmerReducer<State> {
    setFirstName(firstName: string) {
        // draftState has the State type but the readonly
        // flags are removed here to allow type safe mutation
        this.draftState.firstName = firstName;
    }

    setLastName(lastName: string) {
        this.draftState.lastName = lastName;
    }
}
```

The generated `ActionsTypes` object now respects the types used in the class

```ts
const ActionCreators = createActionCreators(MyImmerReducer);

ActionCreators.setFirstName("Charlie"); // OK
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

## Examples

Here's a more complete example with [redux-render-prop](https://github.com/epeli/redux-render-prop):

<https://github.com/epeli/typescript-redux-todoapp>
