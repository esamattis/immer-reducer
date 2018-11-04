# Immer Reducer

[![Greenkeeper badge](https://badges.greenkeeper.io/epeli/immer-reducer.svg)](https://greenkeeper.io/)

Create (type safe) Redux reducers using [Immer](https://github.com/mweststrate/immer)!

## Install

    npm install immer-reducer

## Usage

Reducers are defined by extending from the `ImmerReducer` class

```js
import {ImmerReducer, createActionCreators} from "immer-reducer";

export class MyImmerReducer extends ImmerReducer {
    // each method becomes a reducer
    setFirstName(firstName) {
        // State update are simple as assigning a value to the state property thanks to Immer
        this.draftState.firstName = firstName;
    }

    setLastName(lastName) {
        this.draftState.lastName = lastName;
    }

    // You can combine reducers too
    setName(firstName, lastName) {
        this.setFirstName(firstName);
        this.setLastName(firstName);
    }
}
```

Generate Action Creators and the actual reducer function for Redux

```js
import {createActionCreators, createReducerFunction} from "immer-reducer";

export const ActionCreators = createActionCreators(MyImmerReducer);
export const reducerFunction = createReducerFunction(MyImmerReducer);
```

and create a Redux store

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

Under the hood the class is desconstructed to following actions:

```js
{
    type: "IMMER_REDUCER:setFirstName",
    payload: ["Charlie"],
}
{
    type: "IMMER_REDUCER:setLastName",
    payload: ["Brown"],
}
```

So the method names becomes Redux Action Types and the method arguments
becomes the action payload. The reducer function will then match these
actions against the class and calls the approciate methods with the payload
spread to the arguments. But do note that the action format is not part of
the public API so don't write any code relying on it. The actions are handled
by the generated reducer function.

The generated reducer function executes the methods inside the `produce()`
function of Immer enabling the terse mutatable style updates.

# 100% Type Safety With Typescript

This library by no means requires you to use Typescript but it was written
spesifically Typescript usage in mind because I was unable to find any other
libraries that are both boilerplate free and 100% type safe.

The Typescript usage does not differ that much from the Javascript usage.
Just pass your state type as the type argument for the class

```ts
const initialState = {
    firstName: "",
    lastName: "",
};

class MyImmerReducer extends ImmerReducer<typeof initialState> {
    setFirstName(firstName: string) {
        this.draftState.firstName = firstName;
    }

    setLastName(lastName: string) {
        this.draftState.lastName = lastName;
    }
}
```

The generated ActionsTypes object now respects the types used in the class

```ts
const ActionCreators = createActionCreators(MyImmerReducer);

ActionCreators.setFirstName("Charlie"); // OK
ActionCreators.setFirstName(1); // Type error
ActionCreators.setWAT("Charlie"); // Type error
```

The reducer function is also typed properly

```ts
const reducer = createReducerFunction(MyImmerReducer);

reducer(initialState, ActionCreators.setFirstName("Charlie")); // OK
reducer(initialState, {type: "WAT"}); // Type error
reducer({wat: "bad state"}, ActionCreators.setFirstName("Charlie")); // Type error
```

If you enjoy this then also checkout
[redux-render-prop](https://github.com/epeli/redux-render-prop) for type safe
`connect()` alternative.
