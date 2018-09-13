interface Action {
    type: string;
}

interface ReduxDispatch {
    (action: any): unknown;
}

interface GetState {
    (): unknown;
}

type OnlyPromise<T> = T extends (...args: any[]) => Promise<any>
    ? Promise<void>
    : void;

function isPromise(o: any): o is Promise<void> {
    return Boolean(o && typeof o.then === "function");
}

class SimpleStore {
    _dispatch: ReduxDispatch;
    getState: GetState;

    constructor(dispatch: ReduxDispatch, getState: GetState) {
        this._dispatch = dispatch;
        this.getState = getState;
        this.dispatch = this.dispatch.bind(this);
    }

    dispatch<T extends Function | Action>(action: T): OnlyPromise<T> {
        const ret = this._dispatch(action);

        if (isPromise(ret)) {
            return ret as any;
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
    ): (
        ...args: ThunkArg
    ) => (reduxDispatch: ReduxDispatch, getState: GetState) => ThunkReturn {
        function myThunk(...args: ThunkArg) {
            return (reduxDispatch: ReduxDispatch, getState: GetState) => {
                const mapped = mapStore(
                    new SimpleStore(reduxDispatch, getState),
                );
                const wat = thunk(...args)(mapped);
                return wat;
            };
        }

        return myThunk;
    }

    return createThunk;
}
