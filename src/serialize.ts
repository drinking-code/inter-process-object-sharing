function isNativeObject(value: object) {
    return !!Reflect.ownKeys(global).map(key => (global as any)[key as string])
        .find(obj => obj?.constructor === value.constructor || obj === value.constructor || obj === value)
}

export const classes: Map<string, Function> = new Map()
export const deSerialize: Map<Function, { serialize?: (value?: object) => SerializableType, deserialize?: (value: SerializedType) => object }> = new Map()

export type SerializedType =
    string
    | number
    | boolean
    | null
    | undefined
    | Array<SerializedType>
    | { [k: string]: SerializedType }

export type SerializableType =
    string
    | number
    | boolean
    | null
    | undefined
    | Function
    | Array<SerializableType>
    | { [k: string]: SerializableType }
    | Set<SerializableType>
    | Map<SerializableType, SerializableType>

export function serialize(value: any): any | void {
    // todo: handle other builtins
    if (['string', 'number', 'boolean'].includes(typeof value) || !value) {
        return value
    } else if (Array.isArray(value)) {
        return value.map(v => serialize(v))
    } else if (value.constructor === {}.constructor || value.__original?.constructor === {}.constructor) {
        return Object.fromEntries(
            Array.from(Object.entries(value))
                .map(([key, value]) => [key, serialize(value)])
        )
    } else if (typeof value === 'function') {
        return {
            $$iposType: 'Function',
            data: value.toString()
        }
    } else if (value instanceof Set) {
        return {
            $$iposType: 'Set',
            data: Array.from(value.entries())
                .map(([v]) => serialize(v))
        }
    } else if (value instanceof Map) {
        return {
            $$iposType: 'Map',
            data: Object.fromEntries(
                Array.from(value.entries())
                    .map(([key, value]) => [key, serialize(value)])
            )
        }
    } else if (isNativeObject(value)) {
        throw new Error(`Could not serialise: \`${value.constructor.name}\`.`)
    } else {
        value = value.__original ?? value
        const serializeMethod = deSerialize.get(value.constructor)?.serialize ?? value.stringify ?? value.serialize
        if (!serializeMethod)
            throw new Error(
                `Class: \`${value.constructor.name}\` must have methods to serialize and deserialize objects. (\`.stringify()\`, \`.serialize()\`)`
            )

        return {
            $$iposType: value.constructor.name,
            data: serialize(
                serializeMethod.call(value, value)
            )
        }
    }
}

export function deserialize(value: string | number | Array<any> | { $$iposType?: string, data: any }): any | void {
    if (['string', 'number'].includes(typeof value)) {
        return value
    } else if (Array.isArray(value)) {
        return value.map(deserialize)
    } else if (typeof value === 'object') {
        if (!value.$$iposType) {
            return Object.fromEntries(
                Array.from(
                    Object.entries(value)
                        .map(([key, value]) =>
                            [key, deserialize(value)]
                        )
                )
            )
        } else if (value.$$iposType === 'Function') {
            // todo: is this acceptable?
            return eval(`(${value.data})`)
        } else if (value.$$iposType === 'Set') {
            return new Set(
                value.data.map(deserialize)
            )
        } else if (value.$$iposType === 'Map') {
            return new Map(
                Array.from(Object.entries(value.data))
                    .map(deserialize)
            )
        } else if (classes.has(value.$$iposType)) {
            const constructor = classes.get(value.$$iposType) as Function
            const deserializeMethod = deSerialize.get(constructor)?.deserialize ??
                (constructor as unknown as { from: Function })?.from

            if (!deserializeMethod)
                throw new Error(`Did not recognize type \`${value.$$iposType}\`. Did you register it in the child process?`)

            return deserializeMethod(deserialize(value.data))
        } else {
            throw new Error(`Did not recognize type \`${value.$$iposType}\`. Did you register it in the child process?`)
        }
    } else
        console.warn('I don\'t know', value)
}
