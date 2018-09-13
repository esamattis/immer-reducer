import {
    ActionTypesFromSimpleActions,
    SimpleActionsObject,
    SimpleActionsMeta,
} from "./create-simple-actions";

interface Thunk {
    (dispatch: Dispatch, getState: GetState): void;
}

interface Action {
    type: string;
}

interface Dispatch {
    (action: Action | Thunk): Promise<null> | void;
}

interface GetState {
    (): any;
}

interface SimpleStore {
    getState: GetState;
    dispatch: Dispatch;
}

interface JustThunk {
    (...args: any[]): void;
}

export function makeThunkCreator<MappedStore>(
    mapStore: (store: SimpleStore) => MappedStore,
) {
    function createThunk<ThunkArg>(
        thunk: (arg: ThunkArg) => (arg: MappedStore) => void,
    ): (arg: ThunkArg) => JustThunk {
        function myThunk(arg: ThunkArg) {
            return (dispatch: any, getState: any) => {
                const mapped = mapStore({dispatch, getState});
                return thunk(arg)(mapped);
            };
        }

        return myThunk;
    }

    return createThunk;
}
