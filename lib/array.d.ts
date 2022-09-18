export default class InterceptedArray<T> extends Array {
    private callback;
    constructor(callback: (object: object, method: string, ...args: any) => void);
    copyWithin(target: number, start: number, end?: number): this;
    fill(value: T, start?: number, end?: number): this;
    pop(): T | undefined;
    push(...items: T[]): number;
    reverse(): T[];
    shift(): T | undefined;
    sort(compareFn?: (a: T, b: T) => number): this;
    splice(start: number, deleteCount?: number): T[];
    unshift(...items: T[]): number;
}
