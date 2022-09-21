import IPOS from '../main'
import subProcessIPCLoopback from './subProcessIPCLoopback'
import {withoutProcessSend} from './withoutProcessSendSync'

async function initWith(setValue: (main_ipos: IPOS) => void, probeValue: (sub_ipos: IPOS) => void) {
    const sub_process = new subProcessIPCLoopback()
    let main_ipos: IPOS
    await withoutProcessSend(async () => {
        main_ipos = IPOS.new() as IPOS
        setValue(main_ipos)
    })
    console.log('sub_ipos')
    let sub_ipos = IPOS.new()
    console.log('withoutProcessSend')
    await withoutProcessSend(async () => {
        console.log('main_ipos.addProcess')
        // @ts-ignore Argument of type 'subProcessIPCLoopback' is not assignable to parameter of type 'ChildProcess'
        await main_ipos.addProcess(sub_process)
        console.log('done main_ipos.addProcess')
    })
    console.log('await sub_ipos')
    sub_ipos = await sub_ipos
    probeValue(sub_ipos)
    sub_process.destroy()
}

/*describe('Synchronising fields between processes', () => {
    const examples: { [key: string]: unknown } = {
        'string': 'myString',
        'number': 42,
        'object': {
            myKey: 'myValue',
            mySecondValue: 42
        },
        'array': ['myItem', 42],
        'set': new Set(['myItem', 42]),
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
                    console.log(value)
                    console.log(sub_ipos.myField)
                    // expect(sub_ipos.get('myField')).toEqual(value)
                    // expect(sub_ipos.myField).toEqual(value)
                }
            )
        })
    }
})*/
