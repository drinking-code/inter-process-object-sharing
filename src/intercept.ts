export default function intercept(value: object, key: string, interceptCallback: (key: string, method: string, ...args: any) => void): object {
    const arrayMutatingMethods = ['copyWithin', 'fill', 'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift']
    const objectMutatingMethods: string[] = []
    const mapMutatingMethods = ['clear', 'delete', 'set']
    const setMutatingMethods = ['add', 'clear', 'delete']
    const functionMutatingMethods: string[] = []
    const mutatingMethods = new Map()
    mutatingMethods.set(Array, arrayMutatingMethods)
    mutatingMethods.set({}.constructor, objectMutatingMethods)
    mutatingMethods.set(Map, mapMutatingMethods)
    mutatingMethods.set(Set, setMutatingMethods)
    mutatingMethods.set(Function, functionMutatingMethods)

    if (!mutatingMethods.has(value.constructor))
        return value
    return new Proxy(value, {
        get(target, name: string) {
            if (Reflect.has(target, name) && mutatingMethods.get(value.constructor).includes(name)) {
                const method = Reflect.get(target, name)
                return (...args: any) => {
                    interceptCallback(key, name, ...args)
                    method.call(value, ...args)
                }
            } else {
                let value = Reflect.get(target, name)
                if (typeof value === 'function')
                    value = value.bind(target)
                return value
            }
        },
        set(target, name: string, value: any): boolean {
            // @ts-ignore
            const result = (target[name] = value)
            if (!!result) {
                interceptCallback(key, '$$iposDefine', name, value)
            }
            return !!result
        },
    })
}
