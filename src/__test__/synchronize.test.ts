import IPOS from '../main'

import SubProcessIPCLoopback from './sub-process-ipc-loopback'
import {withoutProcessSend} from './without-process-send'
import createFieldsTest from './run-create-fields-test'

describe('Synchronising fields', () =>
    createFieldsTest(
        async (setValue: (ipos_for_setting: IPOS) => void, probeValue: (ipos_for_probing: IPOS) => void) => {
            const sub_process = new SubProcessIPCLoopback()
            let main_ipos: IPOS, sub_ipos: IPOS
            withoutProcessSend(() => {
                main_ipos = IPOS.new() as IPOS
                setValue(main_ipos)
            })

            await Promise.all([
                // @ts-ignore Argument of type 'SubProcessIPCLoopback' is not assignable to parameter of type 'ChildProcess'
                main_ipos.addProcess(sub_process),
                expect((async () => sub_ipos = await IPOS.new())()).resolves.not.toThrow()
            ])

            // @ts-ignore Variable 'sub_ipos' is used before being assigned.
            probeValue(sub_ipos)

            sub_process.destroy()
        },
        (key) => `Synchronise ${key}`)
)
