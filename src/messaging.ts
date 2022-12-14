import {ChildProcess} from 'child_process'
import {deserialize, serialize} from './serialize.js'

export type iposMessagingType = 'ready' | 'register' | 'update' | 'sync' | 'sync_ok' | 'set' | 'delete'
type iposMessagingCallback = (message: iposMessagingMessage) => (any | void)
export type iposMessagingMessage = {
    protocol: 'ipos',
    type: iposMessagingType,

    fields?: string | Map<string, any>, // serialised, de-serialised

    do?: string,
    on?: string,
    with?: Array<string> | Array<any>,

    key?: string,
    value: string | any,
} & { [k: string]: string }

const mustHaveSendError = new Error(`Process must have a \`.send()\` method.`)

export default class IPOSMessaging {
    private listeners: Map<iposMessagingType, Array<iposMessagingCallback>>
    private nonIPOSListeners: Set<(message: any) => any>
    private process: ChildProcess | NodeJS.Process

    constructor(process: ChildProcess | NodeJS.Process) {
        this.listeners = new Map()
        this.nonIPOSListeners = new Set()
        if (!process.send) throw mustHaveSendError
        this.process = process
        this.process.on('message', (message: iposMessagingMessage) => {
            if (!message || typeof message !== 'object' || message.protocol !== 'ipos')
                // not a message from ipos
                return this.nonIPOSListeners.forEach(callback => callback(message))

            if (message.type === 'ready') {
                this.send('register')
                return
            }

            for (const property in message) {
                message[property] = deserialize(message[property])
            }

            if (this.listeners.has(message.type)) {
                this.listeners.get(message.type)
                    ?.forEach(callback => callback(message))
            }
        })
    }

    /*getNonIPOSMessages(handler: (message: any) => any) {
        this.nonIPOSListeners.add(handler)
    }*/

    send(type: iposMessagingType, data?: {}) {
        (this.process as ChildProcess).send({
            protocol: 'ipos',
            type,
            ...serialize(data)
        })
    }

    listenForType(type: iposMessagingType, callback: iposMessagingCallback) {
        let callbacks: Array<iposMessagingCallback> = this.listeners.get(type) ?? []
        callbacks.push(callback)
        this.listeners.set(type, callbacks)
    }

    listenOnceForType(type: iposMessagingType, callback: iposMessagingCallback) {
        let callbacks: Array<iposMessagingCallback> = this.listeners.get(type) ?? []
        const onceCallback = (message: iposMessagingMessage) => {
            delete callbacks[callbacks.indexOf(onceCallback)]
            callback(message)
        }
        callbacks.push(onceCallback)
        this.listeners.set(type, callbacks)
    }

    destroy() {
        this.listeners.clear()
        this.nonIPOSListeners.clear()
    }
}
