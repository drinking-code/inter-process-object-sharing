export default class InterceptedArray<T> extends Array {
    private readonly callback

    // intercepts only methods that change the object
    constructor(callback: (object: object, method: string, ...args: any) => void) {
        super()
        this.callback = callback
    }

    static new<T>(arrayLike: ArrayLike<T>, callback: (object: object, method: string, ...args: any) => void): InterceptedArray<T> {
        const interceptedArray: InterceptedArray<T> =
            new InterceptedArray(callback)
        for (let i = 0; i < arrayLike.length; i++) {
            interceptedArray[i] = arrayLike[i]
        }
        return interceptedArray
    }

    copyWithin(target: number, start: number, end?: number): this {
        this.callback(this, 'copyWithin', target, start, end)
        return super.copyWithin(target, start, end)
    }

    fill(value: T, start?: number, end?: number): this {
        this.callback(this, 'fill', value, start, end)
        return super.fill(value, start, end)
    }

    pop(): T | undefined {
        this.callback(this, 'pop')
        return super.pop()
    }

    push(...items: T[]): number {
        this.callback(this, 'push', ...items)
        return super.push(...items)
    }

    reverse(): T[] {
        this.callback(this, 'reverse')
        return super.reverse()
    }

    shift(): T | undefined {
        this.callback(this, 'shift')
        return super.shift()
    }

    sort(compareFn?: (a: T, b: T) => number): this {
        this.callback(this, 'sort', compareFn)
        return super.sort(compareFn)
    }

    splice(start: number, deleteCount?: number): T[] {
        this.callback(this, 'splice', start, deleteCount)
        return super.splice(start, deleteCount)
    }

    unshift(...items: T[]): number {
        this.callback(this, 'unshift', ...items)
        return super.unshift(...items)
    }
}
