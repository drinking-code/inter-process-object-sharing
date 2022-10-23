import child_process from 'child_process'

import IPOS from '../main'
import {withoutProcessSend} from './without-process-send'
import IPOSMessaging from '../messaging'
import createConnectedInstances from "./create-connected-instances";
import {examples} from "./test-data";

describe('Probing errors', () => {
    it('Changing inherent property', () => {
        let ipos: IPOS
        withoutProcessSend(() => ipos = IPOS.new() as IPOS)
        expect(() => ipos.get = (key) => 'myValue').toThrow()
    })

    it('Set uncreated field', () => {
        let ipos: IPOS
        withoutProcessSend(() => ipos = IPOS.new() as IPOS)
        expect(() => ipos.myKey = 'myValue').toThrow()
    })

    it('Add process without ipc channel', () => {
        withoutProcessSend(() => {
            const ipos = IPOS.new() as IPOS
            const sub_process = child_process.spawn('node', ['../../example/sub-process.js'])
            expect(() => ipos.addProcess(sub_process)).toThrow()
        })
    })

    it('Create IPOSMessaging instance with process without ipc channel', () => {
        withoutProcessSend(() => {
            expect(() => new IPOSMessaging(process)).toThrow()
        })
    })

    it('Serialise unknown native object', async () => {
        const {main_ipos} = await createConnectedInstances()
        const buffer = new ArrayBuffer(2)
        expect(() => main_ipos.create('myKey', new DataView(buffer))).toThrow()
    })

    it('Serialise unregistered class', async () => {
        const {main_ipos, sub_ipos, sub_process} = await createConnectedInstances()

        class Unregistered {
        }

        const unregisteredInstance = new Unregistered()
        expect(() => main_ipos.create('myKey', unregisteredInstance))
            .toThrowError(`Class: \`${unregisteredInstance.constructor.name}\` must have methods to serialize and deserialize objects. (\`.stringify()\`, \`.serialize()\`)`)
    })

    it('Deserialise unregistered class', async () => {
        const {main_ipos, sub_ipos, sub_process} = await createConnectedInstances()

        class Unregistered {
            serialize() {
                return 'unregisteredClass'
            }
        }

        const unregisteredInstance = new Unregistered()
        expect(() => main_ipos.create('myKey', unregisteredInstance))
            .toThrowError(`Did not recognize type \`${unregisteredInstance.constructor.name}\`. Did you register it in the child process?`)
    })

    it('Deserialise registered class without deserialisation method', async () => {
        const {main_ipos, sub_ipos, sub_process} = await createConnectedInstances()

        class Registered {
            serialize() {
                return 'unregisteredClass'
            }
        }

        IPOS.registerClass(Registered)

        const registeredInstance = new Registered()
        expect(() => main_ipos.create('myKey', registeredInstance))
            .toThrowError(`Did not recognize type \`${registeredInstance.constructor.name}\`. Did you register it in the child process?`)
    })
})
