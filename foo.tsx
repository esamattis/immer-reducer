interface State {
    firstName: string;
    lastName: string;
}

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
