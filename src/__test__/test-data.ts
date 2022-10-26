import IPOS from '../main'

class TestClass {
    data: any

    constructor(data: any) {
        this.data = data
    }

    stringify() {
        return this.data
    }

    static from(data: any) {
        return new TestClass(data)
    }
}

IPOS.registerClass(TestClass)

export const examples = {
    'string': 'myString',
    'number': 42,
    'object': {
        myKey: 'myValue',
        mySecondValue: 42
    },
    'array': ['myItem', 42],
    'map': new Map(Object.entries({
        myKey: 'myValue',
        mySecondValue: 42
    })),
    'set': new Set(['myItem', 42]),
    'function': (a: number, b: number) => a + b,
    'class': new TestClass('myClass'),
    'eventTarget': new EventTarget(),
}

// exemplary; don't iterate every possible method, just do one direct value assignment and one method
export const exampleChanges = {
    array: [
        (array: typeof examples.array) => array[1] = 43,
        (array: typeof examples.array) => array.push('added value'),
    ],
    object: [
        (object: typeof examples.object) => object.myKey = 'yourValue',
        // no mutating method
    ],
    set: [
        // no direct value assignment
        (set: typeof examples.set) => set.add('added value'),
    ],
    map: [
        // no direct value assignment
        (map: typeof examples.map) => map.set('myKey', 'yourValue'),
    ],
}
