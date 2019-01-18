enum ActionTypes {
    SET_FIRST_NAME = "SET_FIRST_NAME",
    SET_LAST_NAME = "SET_LAST_NAME",
}

interface SetFirstNameAction {
    type: ActionTypes.SET_FIRST_NAME;
    firstName: string;
}

interface SetLastNameAction {
    type: ActionTypes.SET_LAST_NAME;
    lastName: string;
}

type Action = SetFirstNameAction | SetLastNameAction;

function reducer(action: Action, state: State): State {
    switch (action.name) {
        case "SET_FIRST_NAME":
            return {...state, firstName: action.firstName};
        case "SET_LAST_NAME":
            return {...state, lastName: action.lastName};
        default:
            return state;
    }
}
