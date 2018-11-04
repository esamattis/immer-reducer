import produce, {Draft} from "immer";

type ArgumentsType<T> = T extends (...args: infer V) => any ? V : never;

type FunctionPropertyNames<T> = {
    [K in keyof T]: T[K] extends Function ? K : never
}[keyof T];

type Methods<T> = Pick<T, FunctionPropertyNames<T>>;

type FlattenToReturnTypes<T extends {[key: string]: () => any}> = {
    [K in keyof T]: ReturnType<T[K]>
};

type ObjectValueTypes<T> = T[keyof T];

type ReturnTypeUnion<T extends {[key: string]: () => any}> = ObjectValueTypes<
    FlattenToReturnTypes<T>
>;

export interface ImmerReducerClass {
    new (...args: any[]): ImmerReducer<any>;
}

type ImmerReducerState<T> = T extends {
    prototype: {
        state: infer V;
    };
}
    ? V
    : never;

export type ActionCreators<ClassActions extends ImmerReducerClass> = {
    [K in keyof Methods<InstanceType<ClassActions>>]: (
        ...args: ArgumentsType<InstanceType<ClassActions>[K]>
    ) => {
        type: K;
        payload: ArgumentsType<InstanceType<ClassActions>[K]>;
    }
};

export class ImmerReducer<T> {
    readonly state: T;
    readonly draftState: Draft<T>;

    constructor(draftState: Draft<T>, state: T) {
        this.state = state;
        this.draftState = draftState;
    }
}

export function createActionCreators<T extends ImmerReducerClass>(
    immerReducerClass: T,
): ActionCreators<T> {
    const creators: {[key: string]: Function} = {};

    Object.keys(immerReducerClass.prototype).forEach(key => {
        const method = immerReducerClass.prototype[key];

        if (typeof method !== "function") {
            return;
        }

        creators[key] = (...args: any[]) => {
            return {
                type: key,
                payload: args,
            };
        };
    });

    return creators as any;
}

interface ImmerReducerFunction<T extends ImmerReducerClass> {
    (
        state: ImmerReducerState<T> | undefined,
        action: ReturnTypeUnion<ActionCreators<T>>,
    ): ImmerReducerState<T> | undefined;
}

export function createReducerFunction<T extends ImmerReducerClass>(
    immerReducerClass: T,
): ImmerReducerFunction<T> {
    return function immerReducerFunction(state, action) {
        const methodKey = action.type;

        if (typeof immerReducerClass.prototype[methodKey] !== "function") {
            return state;
        }

        if (!state) {
            throw new Error(
                "ImmerReducer does not support undefined state. Pass initial state to createStore()",
            );
        }

        return produce(state as any, draftState => {
            const reducers: any = new immerReducerClass(draftState, state);

            reducers[methodKey](...action.payload);

            return draftState;
        });
    };
}
