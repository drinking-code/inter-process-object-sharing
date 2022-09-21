import {ChildProcess} from 'child_process'
import initChild from './init-child.js'
import IPOSMessaging, {iposMessagingMessage, iposMessagingType} from './messaging.js'
import intercept from './intercept.js'

export default class IPOS {
    private readonly fields: Map<string, ProxyHandler<any>>
    private readonly fieldsRaw: Map<string, any>
    private fieldsReverseMap: Map<ProxyHandler<any>, string>
    private processMessagingMap: Map<ChildProcess, IPOSMessaging>
    private readonly proxy
    protected messaging?: IPOSMessaging
    [field: string]: unknown;

    static new(): IPOS | Promise<IPOS> {
        const ipos = new IPOS()
        // was called on child process
        if (process.send) {
            return new Promise(async resolve => {
                await initChild.call(ipos)
                resolve(ipos)
            })
        }
        return ipos
    }

    constructor() {
        this.fields = new Map()
        this.fieldsRaw = new Map()
        this.fieldsReverseMap = new Map()
        this.processMessagingMap = new Map()

        if (process.send) {
            this.messaging = new IPOSMessaging(process)
        }

        // proxy makes all "target.fields" available as "actual" fields
        this.proxy = new Proxy(this, {
            get(target, name: string) {
                if (Reflect.has(target, name)) {
                    return Reflect.get(target, name)
                } else if (target.fields.has(name)) {
                    return target.fields.get(name)
                }
            },
            set(target, name: string, value: any): boolean {
                if (Reflect.has(target, name)) {
                    throw Error(`Cannot change inherent property \`${name}\``)
                } else if (!target.fields.has(name)) {
                    throw Error(`Cannot set unknown field \`${name}\`. Initialise a field with \`.create()\``)
                } else {
                    target.create(name, value)
                    return true
                }
            },
        })
        return this.proxy
    }

    /****************** MESSAGING *******************/
    protected mountListeners(messaging: IPOSMessaging) {
        messaging.listenForType('update', (message) => this.performUpdate(message))
        messaging.listenForType('set', (message) => this.performSet(message))
        messaging.listenForType('delete', (message) => this.performDelete(message))
    }

    private sendToAll(type: iposMessagingType, data?: {}) {
        this.messaging?.send(type, data)
        this.processMessagingMap.forEach(processMessaging => {
            processMessaging.send(type, data)
        })
    }

    /*public getNonIPOSMessages(process: ChildProcess, handler: (message: any) => any) {
        this.processMessagingMap.get(process)?.getNonIPOSMessages(handler)
    }*/

    /********************* GET **********************/
    public get(key: string): any {
        return this.fields.get(key)
    }

    private getRaw(key: string): any {
        return this.fields.get(key)
    }

    /******************** CREATE ********************/
    public create(key: string, value: any): void {
        this.createStealthy(key, value)
        this.sendToAll('set', {key, value})
    }

    protected createStealthy(key: string, value: object): void {
        this.fieldsRaw.set(key, value)
        if (typeof value === 'object')
            value = intercept(value, key, this.sendMethodCall.bind(this))

        this.fields.set(key, value)
        this.fieldsReverseMap.set(value, key)
    }

    private performSet(message: iposMessagingMessage) {
        if (!message.key || !message.value) return
        this.createStealthy(message.key, message.value)
    }

    /******************** UPDATE ********************/
    private performUpdate(message: iposMessagingMessage) {
        if (!message.do || !message.on) return
        if (message.do === '$$iposDefine') {
            if (!message.with) return
            this.fieldsRaw.get(message.on)[message.with[0]] = message.with[1]
        } else {
            this.fieldsRaw.get(message.on)[message.do](...(message.with ?? []))
        }
    }

    private sendMethodCall(key: string, method: string, ...args: any) {
        this.sendToAll('update', {
            do: method,
            on: key,
            with: Array.from(args)
        })
    }

    /******************** DELETE ********************/
    public delete(key: string): boolean {
        this.sendToAll('delete', {key})
        return this.deleteStealthy(key)
    }

    private deleteStealthy(key: string): boolean {
        return this.fields.delete(key)
    }

    private performDelete(message: iposMessagingMessage) {
        if (!message.key) return
        return this.deleteStealthy(message.key)
    }

    /******************* PROCESS ********************/
    public addProcess(process: ChildProcess): Promise<void> {
        if (!process.send)
            throw new Error(`Process must have an ipc channel. Activate by passing "stdio: [<stdin>, <stdout>, <stderr>, 'ipc']" as an option.`)
        const messaging = new IPOSMessaging(process)

        let registered = false, resolve: Function
        const promise: Promise<void> = new Promise(res => resolve = res)
        messaging.listenForType('register', () => {
            if (registered) return
            registered = true

            this.mountListeners(messaging)
            this.processMessagingMap.set(process, messaging)
            this.syncProcess(process)
                .then(() =>
                    resolve()
                )
        })
        // send a "ready" message to receive another "register" (if an instance is initiated)
        messaging.send('ready')
        return promise
    }

    private syncProcess(process: ChildProcess): Promise<void> {
        let resolve: Function
        const promise: Promise<void> = new Promise(res => resolve = res)
        this.processMessagingMap.get(process)?.listenOnceForType('sync_ok', () => {
            resolve()
        })
        this.processMessagingMap.get(process)?.send('sync', {fields: this.fields})
        return promise
    }
}
