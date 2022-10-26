import {classes as registeredClassesMap} from './serialize.js'

export default function intercept<V>(value: V, key: string, interceptCallback: (key: string, method: string, ...args: any) => void): V {
    const arrayMutatingMethods = ['copyWithin', 'fill', 'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift']
    const objectMutatingMethods: string[] = []
    const mapMutatingMethods = ['clear', 'delete', 'set']
    const setMutatingMethods = ['add', 'clear', 'delete']
    const functionMutatingMethods: string[] = []
    const eventTargetMutatingMethods = ['dispatchEvent']
    const mutatingMethods = new Map()
    mutatingMethods.set(Array, arrayMutatingMethods)
    mutatingMethods.set({}.constructor, objectMutatingMethods)
    mutatingMethods.set(Map, mapMutatingMethods)
    mutatingMethods.set(Set, setMutatingMethods)
    mutatingMethods.set(Function, functionMutatingMethods)
    mutatingMethods.set(EventTarget, eventTargetMutatingMethods)

    const registeredClasses = Array.from(registeredClassesMap.values())

    if (!value || typeof value !== 'object' || !(mutatingMethods.has(value.constructor) || registeredClasses.includes(value.constructor)))
        return value

    return new Proxy(value, {
        get(target, name: string) {
            if (name === '__original')
                return value
            if (!Reflect.has(target, name))
                return
            let property = Reflect.get(target, name)
            if (property === target.constructor)
                return property
            if ((
                mutatingMethods.get(value.constructor)?.includes(name) || registeredClasses.includes(value.constructor)
            ) && typeof property === 'function') {
                return (...args: any) => {
                    interceptCallback(key, name, ...args)
                    return property.call(target, ...args)
                }
            } else {
                if (typeof property === 'function')
                    property = property.bind(target);
                return property;
            }
        },
        set(target: V, name, value: any): boolean {
            target[name as keyof typeof target] = value
            interceptCallback(key, '$$iposDefine', name as any, value)
            return true
        },
    })
}
