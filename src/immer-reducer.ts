import {Draft} from "immer";

type ArgumentsType<T> = T extends (...args: infer V) => any ? V : never;

type FunctionPropertyNames<T> = {
    [K in keyof T]: T[K] extends Function ? K : never
}[keyof T];

type Methods<T> = Pick<T, FunctionPropertyNames<T>>;

type JustReturnTypes<T extends {[key: string]: () => any}> = {
    [K in keyof T]: ReturnType<T[K]>
};

type ObjectValueTypes<T> = T[keyof T];

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
    const foo = new immerReducerClass();

    return {} as any;
}

interface ImmerReducerFunction<T extends ImmerReducerClass> {
    (
        state: ImmerReducerState<T>,
        action: ObjectValueTypes<JustReturnTypes<ActionCreators<T>>>,
    ): ImmerReducerState<T>;
}

export function createReducerFunction<T extends ImmerReducerClass>(
    immerReducerClass: T,
): ImmerReducerFunction<T> {
    const foo = new immerReducerClass();
    return {} as any;
}
