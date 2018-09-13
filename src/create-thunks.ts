interface Action {
    type: string;
}

interface ReduxDispatch {
    (action: any): unknown;
}

interface GetState {
    (): unknown;
}

type OnlyPromise<T> = T extends (...args: any[]) => Promise<infer R>
    ? Promise<R>
    : T extends (...args: any[]) => infer R ? R : void;

class SimpleStore {
    private _reduxDispatch: ReduxDispatch;
    getState: GetState;

    constructor(dispatch: ReduxDispatch, getState: GetState) {
        this._reduxDispatch = dispatch;
        this.getState = getState;
        this.dispatch = this.dispatch.bind(this);
    }

    dispatch<T extends Function | Action>(action: T): OnlyPromise<T> {
        const ret = this._reduxDispatch(action);

        if (typeof action === "function") {
            return ret as any;
        }

        return undefined as any;
    }
}

export function makeThunkCreator<MappedStore>(
    mapStore: (store: SimpleStore) => MappedStore,
) {
    function createThunk<ThunkArg extends any[], ThunkReturn>(
        thunk: (...args: ThunkArg) => (arg: MappedStore) => ThunkReturn,
    ): (
        ...args: ThunkArg
    ) => (reduxDispatch: ReduxDispatch, getState: GetState) => ThunkReturn {
        function myThunk(...args: ThunkArg) {
            return (reduxDispatch: ReduxDispatch, getState: GetState) => {
                const mapped = mapStore(
                    new SimpleStore(reduxDispatch, getState),
                );
                return thunk(...args)(mapped);
            };
        }

        return myThunk;
    }

    return createThunk;
}
