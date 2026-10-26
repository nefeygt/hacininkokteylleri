import type { tr } from "./tr";

type Strings<T> = { [K in keyof T]: T[K] extends string ? string : Strings<T[K]> };

/** The shape every language's dictionary has: Turkish's keys, any strings. */
export type Dictionary = Strings<typeof tr>;
