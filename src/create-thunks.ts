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
    (): unknown;
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
    function createThunk<ThunkArg extends any[]>(
        thunk: (...args: ThunkArg) => (arg: MappedStore) => void,
    ): (...args: ThunkArg) => JustThunk {
        function myThunk(...args: ThunkArg) {
            return (dispatch: any, getState: any) => {
                const mapped = mapStore({dispatch, getState});
                return thunk(...args)(mapped);
            };
        }

        return myThunk;
    }

    return createThunk;
}
