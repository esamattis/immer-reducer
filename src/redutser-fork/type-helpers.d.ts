export type SecondArg<T> = T extends (x: any, y: infer V) => any ? V : never
export type Values<K> = K[keyof K]
export type Just<T> = Omit<T, undefined>
export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>

export type ThunkFunction<Actions, StateT> = (
  dispatcher: ThunkDispatcher<Actions, StateT>,
  getState: () => StateT
) => void | Promise<void>

export interface ThunkDispatcher<Actions, State> {
  (i: Actions): void
  (fn: ThunkFunction<Actions, State>): void
}

export type Exactify<T, X extends T> = T &
  { [K in keyof X]: K extends keyof T ? X[K] : never }
