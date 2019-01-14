import produce, {Draft} from "immer";

const PREFIX = "IMMER_REDUCER";

/** get function arguments as tuple type */
type ArgumentsType<T> = T extends (...args: infer V) => any ? V : never;

/** Get union of function property names */
type FunctionPropertyNames<T> = {
    [K in keyof T]: T[K] extends Function ? K : never
}[keyof T];

/** Pick only methods from object */
type Methods<T> = Pick<T, FunctionPropertyNames<T>>;

/** flatten functions in an object to their return values */
type FlattenToReturnTypes<T extends {[key: string]: () => any}> = {
    [K in keyof T]: ReturnType<T[K]>
};

/** get union of object value types */
type ObjectValueTypes<T> = T[keyof T];

/** get union of object method return types */
type ReturnTypeUnion<T extends {[key: string]: () => any}> = ObjectValueTypes<
    FlattenToReturnTypes<T>
>;

/** type constraint for the ImmerReducer class  */
export interface ImmerReducerClass {
    customName?: string;
    new (...args: any[]): ImmerReducer<any>;
}

/** get state type from a ImmerReducer subclass */
export type ImmerReducerState<T> = T extends {
    prototype: {
        state: infer V;
    };
}
    ? V
    : never;

/** generate reducer function type from the ImmerReducer class */
interface ImmerReducerFunction<T extends ImmerReducerClass> {
    (
        state: ImmerReducerState<T> | undefined,
        action: ReturnTypeUnion<ActionCreators<T>>,
    ): ImmerReducerState<T>;
}

/** ActionCreator function interface with actual action type name */
interface ActionCreator<ActionTypeType, Payload extends any[]> {
    readonly type: ActionTypeType;

    (...args: Payload): {
        type: ActionTypeType;
        payload: Payload;
    };
}

/** generate ActionCreators types from the ImmerReducer class */
export type ActionCreators<ClassActions extends ImmerReducerClass> = {
    [K in keyof Methods<InstanceType<ClassActions>>]: ActionCreator<
        K,
        ArgumentsType<InstanceType<ClassActions>[K]>
    >
};

/** The actual ImmerReducer class */
export class ImmerReducer<T> {
    static customName?: string;
    readonly state: T;
    readonly draftState: Draft<T>; // Make read only states mutable using Draft

    constructor(draftState: Draft<T>, state: T) {
        this.state = state;
        this.draftState = draftState;
    }
}

function removePrefix(actionType: string) {
    return actionType
        .split(":")
        .slice(1)
        .join(":");
}

let KNOWN_REDUCER_CLASSES: typeof ImmerReducer[] = [];

const DUPLICATE_INCREMENTS: {[name: string]: number | undefined} = {};

/**
 * Set customName for classes automatically if there is multiple reducers
 * classes defined with the same name. This can occur accidentaly when using
 * name mangling with minifiers.
 *
 * @param immerReducerClass
 */
function setCustomNameForDuplicates(immerReducerClass: typeof ImmerReducer) {
    const hasSetCustomName = KNOWN_REDUCER_CLASSES.find(klass =>
        Boolean(klass === immerReducerClass),
    );

    if (hasSetCustomName) {
        return;
    }

    const duplicateCustomName =
        immerReducerClass.customName &&
        KNOWN_REDUCER_CLASSES.find(klass =>
            Boolean(
                klass.customName &&
                    klass.customName === immerReducerClass.customName,
            ),
        );

    if (duplicateCustomName) {
        throw new Error(
            `There is already customName ${
                immerReducerClass.customName
            } defined for ${duplicateCustomName.name}`,
        );
    }

    const duplicate = KNOWN_REDUCER_CLASSES.find(
        klass => klass.name === immerReducerClass.name,
    );

    if (duplicate && !duplicate.customName) {
        let number = DUPLICATE_INCREMENTS[immerReducerClass.name];

        if (number) {
            number++;
        } else {
            number = 1;
        }

        DUPLICATE_INCREMENTS[immerReducerClass.name] = number;

        immerReducerClass.customName = immerReducerClass.name + "_" + number;
    }

    KNOWN_REDUCER_CLASSES.push(immerReducerClass);
}

export function createActionCreators<T extends ImmerReducerClass>(
    immerReducerClass: T,
): ActionCreators<T> {
    setCustomNameForDuplicates(immerReducerClass);

    const actionCreators: {[key: string]: Function} = {};

    Object.getOwnPropertyNames(immerReducerClass.prototype).forEach(key => {
        if (key === "constructor") {
            return;
        }

        const method = immerReducerClass.prototype[key];

        if (typeof method !== "function") {
            return;
        }

        const type = `${PREFIX}:${getReducerName(immerReducerClass)}#${key}`;
        const actionCreator = (...args: any[]) => {
            return {
                type,
                payload: args,
            };
        };
        actionCreator.type = type;
        actionCreators[key] = actionCreator;
    });

    return actionCreators as any; // typed in the function signature
}

function getReducerName(klass: {name: string; customName?: string}) {
    return klass.customName || klass.name;
}

export function createReducerFunction<T extends ImmerReducerClass>(
    immerReducerClass: T,
    initialState?: ImmerReducerState<T>,
): ImmerReducerFunction<T> {
    setCustomNameForDuplicates(immerReducerClass);

    return function immerReducerFunction(state, action) {
        if (state === undefined) {
            state = initialState;
        }

        if (!action.type.startsWith(PREFIX + ":")) {
            return state;
        }

        const [className, methodName] = removePrefix(action.type).split("#");

        if (className !== getReducerName(immerReducerClass)) {
            return state;
        }

        if (typeof immerReducerClass.prototype[methodName] !== "function") {
            return state;
        }

        if (!state) {
            throw new Error(
                "ImmerReducer does not support undefined state. Pass initial state to createReducerFunction() or createStore()",
            );
        }

        return produce(state as any, draftState => {
            const reducers: any = new immerReducerClass(draftState, state);

            reducers[methodName](...action.payload);

            return draftState;
        });
    };
}

/**
 * INTERNAL! This is only for tests!
 */
export function _clearKnownClasses() {
    KNOWN_REDUCER_CLASSES = [];
}
