export default function intercept(value, key, interceptCallback) {
    const arrayMutatingMethods = ['copyWithin', 'fill', 'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'];
    const objectMutatingMethods = [];
    const mapMutatingMethods = ['clear', 'delete', 'set'];
    const setMutatingMethods = ['add', 'clear', 'delete'];
    const functionMutatingMethods = [];
    const mutatingMethods = new Map();
    mutatingMethods.set(Array, arrayMutatingMethods);
    mutatingMethods.set({}.constructor, objectMutatingMethods);
    mutatingMethods.set(Map, mapMutatingMethods);
    mutatingMethods.set(Set, setMutatingMethods);
    mutatingMethods.set(Function, functionMutatingMethods);
    if (!mutatingMethods.has(value.constructor))
        return value;
    return new Proxy(value, {
        get(target, name) {
            if (Reflect.has(target, name) && mutatingMethods.get(value.constructor).includes(name)) {
                const method = Reflect.get(target, name);
                return (...args) => {
                    interceptCallback(key, name, ...args);
                    method.call(value, ...args);
                };
            }
            else {
                return Reflect.get(target, name);
            }
        },
        set(target, name, value) {
            // @ts-ignore
            const result = (target[name] = value);
            interceptCallback(key, '$$iposDefine', name, value);
            return !!result;
        },
    });
}