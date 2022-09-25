import IPOS from '../main'
import subProcessIPCLoopback from './subProcessIPCLoopback'
import {withoutProcessSend} from './withoutProcessSend'

describe('Initialising IPOS', () => {
    it('Create new instance in a main process', () => {
        // this is a subprocess anyway
        // just simulate main process by setting process.send to undefined (jamming the subprocess detection)
        withoutProcessSend(() => {
            let ipos
            expect(() => ipos = IPOS.new()).not.toThrow()
            expect(ipos).toBeInstanceOf(IPOS)
        })
    })

    it('Create new instance in a sub process', () => {
        let ipos
        expect(() => ipos = IPOS.new()).not.toThrow()
        expect(ipos).toBeInstanceOf(Promise)
        expect(ipos).resolves.toBeInstanceOf(IPOS)
    })

    /* The child IPOS doesn't actually have to be in the child process.
     * Instead, the child process' ".on("message", handler)" and ".send()" are simulated.
     * The main IPOS instance will send over the simulated "sub_process.send()",
     * and listen over the simulated "sub_process.on("message", handler)".
     * The child IPOS instance will send over the native (intercepted) "process.send()",
     * and listen over the native (intercepted) "process.on("message", handler)".
     */

    it('Connect subprocess after it has initialised', async () => {
        const sub_process = new subProcessIPCLoopback()

        const sub_ipos: Promise<IPOS> = IPOS.new() as Promise<IPOS>
        let main_ipos: IPOS
        withoutProcessSend(() => {
            main_ipos = IPOS.new() as IPOS
        })

        let addProcessPromise
        expect(() =>
            // @ts-ignore Argument of type 'subProcessIPCLoopback' is not assignable to parameter of type 'ChildProcess'
            addProcessPromise = main_ipos.addProcess(sub_process)
        ).not.toThrow()

        expect(addProcessPromise).toBeInstanceOf(Promise)
        expect(sub_ipos).toBeInstanceOf(Promise)

        await Promise.all([
            expect(addProcessPromise).resolves,
            expect(sub_ipos).resolves.toBeInstanceOf(IPOS)
        ])

        sub_process.destroy()
    })

    it('Connect subprocess before it has initialised', async () => {
        const sub_process = new subProcessIPCLoopback()

        let main_ipos: IPOS
        withoutProcessSend(() => {
            main_ipos = IPOS.new() as IPOS
        })

        let addProcessPromise
        expect(() =>
            // @ts-ignore Argument of type 'subProcessIPCLoopback' is not assignable to parameter of type 'ChildProcess'
            addProcessPromise = main_ipos.addProcess(sub_process)
        ).not.toThrow()

        const sub_ipos = IPOS.new()

        expect(addProcessPromise).toBeInstanceOf(Promise)
        expect(sub_ipos).toBeInstanceOf(Promise)

        await Promise.all([
            expect(addProcessPromise).resolves,
            expect(sub_ipos).resolves.toBeInstanceOf(IPOS)
        ])

        sub_process.destroy()
    })
})
