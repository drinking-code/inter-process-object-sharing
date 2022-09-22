import subProcessIPCLoopback from './subProcessIPCLoopback'
import IPOS from '../main'
import {withoutProcessSendSync} from './withoutProcessSendSync'

export default async function createConnectedInstances(): Promise<{ main_ipos: IPOS, sub_ipos: IPOS, sub_process: subProcessIPCLoopback }> {
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

    // @ts-ignore Variable 'main_ipos', 'sub_ipos' is used before being assigned.
    return {main_ipos, sub_ipos, sub_process}
}
