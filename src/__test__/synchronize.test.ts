import _ from 'lodash'

import IPOS from '../main'

import subProcessIPCLoopback from './subProcessIPCLoopback'
import {withoutProcessSend, withoutProcessSendSync} from './withoutProcessSendSync'

async function initWith(setValue: (main_ipos: IPOS) => void, probeValue: (sub_ipos: IPOS) => void) {
    const sub_process = new subProcessIPCLoopback()
    let main_ipos: IPOS, sub_ipos: IPOS
    await withoutProcessSendSync(() => {
        main_ipos = IPOS.new() as IPOS
        setValue(main_ipos)
    })

    await Promise.all([
        // @ts-ignore Argument of type 'subProcessIPCLoopback' is not assignable to parameter of type 'ChildProcess'
        main_ipos.addProcess(sub_process),
        (async () => sub_ipos = await IPOS.new())()
    ])

    // @ts-ignore Variable 'sub_ipos' is used before being assigned.
    probeValue(sub_ipos)

    sub_process.destroy()
}

describe('Synchronisation of fields between processes (transferring existing fields)', () => {
    const examples: { [key: string]: unknown } = {
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
    }

    function customizer(a: any, b: any) {
        // compare function contents
        if ([typeof a, typeof b].every(a => a === 'function')) {
            return a.toString() === b.toString();
        }
    }

    for (const exampleKey in examples) {
        if (!examples.hasOwnProperty(exampleKey)) continue
        it(`Synchronise ${exampleKey}`, async () => {
            const value: unknown = examples[exampleKey]
            await initWith(
                (main_ipos) => {
                    main_ipos.create('myField', value)
                },
                (sub_ipos) => {
                    // lodash equal to compare maps and sets
                    expect(_.isEqualWith(sub_ipos.myField, value, customizer)).toEqual(true)
                    expect(_.isEqualWith(sub_ipos.get('myField'), value, customizer)).toEqual(true)
                }
            )
        })
    }
})
