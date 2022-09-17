import {ChildProcess} from 'child_process'

type iposMessagingType = 'ready' | 'register' | 'update' | 'sync'
type iposMessagingCallback = (message: iposMessagingMessage) => (any | void)
type iposMessagingMessage = {
    protocol: 'ipos',
    type: iposMessagingType,
    fields?: Buffer
}

const mustHaveSendError = new Error(`Process must have a \`.send()\` method.`)

export default class IPOSMessaging {
    private listeners: Map<iposMessagingType | 'any', Array<iposMessagingCallback>>
    private process: ChildProcess | NodeJS.Process

    constructor(process: ChildProcess | NodeJS.Process) {
        this.listeners = new Map()
        if (!process.send) throw mustHaveSendError
        this.process = process
        this.process.on('message', (message: iposMessagingMessage) => {
            try {
                if (message.protocol !== 'ipos')
                    return

                if (message.type === 'ready') {
                    this.send('register')
                    return
                }

                if (this.listeners.has('any')) {
                    this.listeners.get('any')
                        ?.forEach(callback => callback(message))
                }
                if (this.listeners.has(message.type)) {
                    this.listeners.get(message.type)
                        ?.forEach(callback => callback(message))
                }
            } catch (e) {
                // not a message from ipos
            }
        })

        // if the current process is a parent process
        if (process instanceof ChildProcess) {
            // send a "ready" message to receive another "register" (if an instance is initiated)
            this.send('ready')
        }
    }

    send(type: iposMessagingType, data?: {}) {
        if (!this.process.send) throw mustHaveSendError
        this.process.send({
            protocol: 'ipos',
            type,
            ...data
        })
    }

    listenForType(type: iposMessagingType | 'any', callback: iposMessagingCallback) {
        let callbacks: Array<iposMessagingCallback> = this.listeners.get(type) ?? []
        callbacks.push(callback)
        this.listeners.set(type, callbacks)
    }

    listenForAll(callback: iposMessagingCallback) {
        this.listenForType('any', callback)
    }
}
