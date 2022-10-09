import {classes as registeredClassesMap} from './serialize.js'

export default function intercept<V>(value: V, key: string, interceptCallback: (key: string, method: string, ...args: any) => void): V {
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

    const registeredClasses = Array.from(registeredClassesMap.values())

    if (!value || typeof value !== 'object' || !(mutatingMethods.has(value.constructor) || registeredClasses.includes(value.constructor)))
        return value

    return new Proxy(value, {
        get(target, name: string) {
            if (name === '__original')
                return value
            if (Reflect.has(target, name) && (mutatingMethods.get(value.constructor)?.includes(name) || registeredClasses.includes(value.constructor))) {
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
        set(target: V, name, value: any): boolean {
            // if (!target || typeof target !== 'object') return false
            target[name as keyof typeof target] = value
            interceptCallback(key, '$$iposDefine', name, value)
            return true
        },
    })
}
