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
    (action: Action | Thunk): void;
}

interface GetState {
    (): unknown;
}

// interface SimpleStore {
//     getState: GetState;
//     dispatch: Dispatch;
// }

interface JustThunk<T extends Promise<any> | void> {
    (...args: any[]): OnlyPromise<T>;
}

type OnlyPromise<T> = T extends (...args: any[]) => Promise<any>
    ? Promise<void>
    : void;

class SimpleStore {
    _dispatch: any;
    getState: any;

    constructor(dispatch: any, getState: any) {
        this._dispatch = dispatch;
        this.getState = getState;
        this.dispatch = dispatch.bind(this);
    }

    dispatch<T extends Function | Action>(action: T): OnlyPromise<T> {
        const ret = this._dispatch(action);
        if (typeof ret.then === "function") {
            return ret;
        }

        return undefined as any;
    }
}

export function makeThunkCreator<MappedStore>(
    mapStore: (store: SimpleStore) => MappedStore,
) {
    function createThunk<
        ThunkArg extends any[],
        ThunkReturn extends Promise<any> | void
    >(
        thunk: (...args: ThunkArg) => (arg: MappedStore) => ThunkReturn,
    ): (...args: ThunkArg) => (dispatch: any, getState: any) => ThunkReturn {
        function myThunk(...args: ThunkArg) {
            return (dispatch: any, getState: any) => {
                const mapped = mapStore(new SimpleStore(dispatch, getState));
                const wat = thunk(...args)(mapped);
                return wat;
            };
        }

        return myThunk;
    }

    return createThunk;
}
