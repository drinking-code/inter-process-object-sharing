import IPOS from '../main'

import subProcessIPCLoopback from './subProcessIPCLoopback'
import {withoutProcessSendSync} from './withoutProcessSendSync'
import createFieldsTest from './runCreateFieldsTest'

async function initWith(setValue: (main_ipos: IPOS) => void, probeValue: (sub_ipos: IPOS) => void) {
    const sub_process = new subProcessIPCLoopback()
    let main_ipos: IPOS, sub_ipos: IPOS
    await withoutProcessSendSync(() => {
        main_ipos = IPOS.new() as IPOS
    })

    await Promise.all([
        // @ts-ignore Argument of type 'subProcessIPCLoopback' is not assignable to parameter of type 'ChildProcess'
        main_ipos.addProcess(sub_process),
        (async () => sub_ipos = await IPOS.new())()
    ])

    // @ts-ignore Variable 'main_ipos' is used before being assigned.
    setValue(main_ipos)

    // @ts-ignore Variable 'sub_ipos' is used before being assigned.
    probeValue(sub_ipos)

    sub_process.destroy()
}

describe('Updating fields between processes (transferring newly created fields)', () =>
    createFieldsTest(initWith, (key) =>
        ['a', 'e', 'i', 'o', 'u'].some(vowel => key.startsWith(vowel))
            ? `Create an ${key}`
            : `Create a ${key}`
    )
)
