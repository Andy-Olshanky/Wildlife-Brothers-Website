export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type Nullish<T> = T | null | undefined
export type Undefinable<T> = T | undefined
export type Nullable<T> = T | null
