interface ReduxAction {
    type: string;
}

interface ReduxDispatch {
    (action: any): unknown;
}

interface GetState {
    (): unknown;
}

/**
 * For functions return its return type otherwise return void.
 *
 * Different from the core ReturnType which can oly be called for
 * functions.
 */
type FunctionReturnValue<T> = T extends (...args: any[]) => infer R ? R : void;

class SimpleStore {
    private _reduxDispatch: ReduxDispatch;
    getState: GetState;

    constructor(dispatch: ReduxDispatch, getState: GetState) {
        this._reduxDispatch = dispatch;
        this.getState = getState;
        this.dispatch = this.dispatch.bind(this);
    }

    dispatch<T extends Function | ReduxAction>(
        action: T,
    ): FunctionReturnValue<T> {
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
    function createThunk<ThunkArgs extends any[], ThunkReturn>(
        thunk: (...args: ThunkArgs) => (arg: MappedStore) => ThunkReturn,
    ): (
        ...args: ThunkArgs
    ) => (reduxDispatch: ReduxDispatch, getState: GetState) => ThunkReturn {
        function myThunk(...args: ThunkArgs) {
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
