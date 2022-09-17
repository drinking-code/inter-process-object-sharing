import InterceptedArray from './intercept/array.js'

export default function intercept(value: object, interceptCallback: (object: object, method: string, ...args: any) => void): object {
    if (Array.isArray(value)) {
        value = new InterceptedArray(interceptCallback)
    }
    /*Object.getOwnPropertyNames(Object.getPrototypeOf(value))
        .filter(methodName => !(methodName.startsWith('__') && methodName.endsWith('__')))
        .forEach(methodName => {
            if (!value[methodName]) return
            const method = value[methodName]
            value[methodName] = function (...args: any) {
                // interception
                console.log(methodName)
                method.call(value, ...args)
            }
        })
    */
    return value
}
