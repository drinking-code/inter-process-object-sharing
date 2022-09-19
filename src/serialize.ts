export function serialize(value: any): any | void {
    // todo: handle other builtins
    if (['string', 'number', 'boolean'].includes(typeof value) || !value) {
        return value
    } else if (typeof value === 'function') {
        return {
            $$iposType: 'Function',
            data: value.toString()
        }
    } else if (Array.isArray(value)) {
        return value.map(v => serialize(v))
    } else if (value.constructor === {}.constructor) {
        return Object.fromEntries(
            Array.from(Object.entries(value))
                .map(([key, value]) => [key, serialize(value)])
        )
    } else if (value instanceof Map) {
        return {
            $$iposType: 'Map',
            data: new Map(
                Array.from(value.entries())
                    .map(([key, value]) => [key, serialize(value)])
            )
        }
    } else {
        if (!value.stringify && !value.serialize)
            throw new Error(
                `Class: \`${value.constructor.name}\` must have methods to serialize and deserialize objects. (\`.stringify()\`, \`.serialize()\`)`
            )
        // return value.toString()
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
        } else if (value.$$iposType === 'Map') {
            return Object.fromEntries(
                Array.from(Object.entries(value.data))
                    .map(deserialize)
            )
        }
    } else
        console.warn('I don\'t know', value)
}
