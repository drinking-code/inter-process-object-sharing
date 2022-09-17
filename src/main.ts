import {ChildProcess} from 'child_process'
import initChild from './init-child.js'
import IPOSMessaging from './messaging.js'
import {deserialize, serialize} from './serialize.js'
import intercept from './intercept.js'

export default class IPOS {
    private readonly fields: Map<string, object>
    private fieldsReverseMap: Map<object, string>
    private processMessagingMap: Map<ChildProcess, IPOSMessaging>
    private readonly proxy
    protected messaging?: IPOSMessaging

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
        this.fieldsReverseMap = new Map()
        this.processMessagingMap = new Map()

        // proxy makes all "target.fields" available as "actual" fields
        this.proxy = new Proxy(this, {
            get(target, name: string) {
                if (Reflect.has(target, name)) {
                    return Reflect.get(target, name)
                } else if (target.fields.has(name)) {
                    return target.fields.get(name)
                }
            }
        })
        return this.proxy
    }

    public get(key: string): any {
        return this.fields.get(key)
    }

    // todo: also accept and update non-object values
    public create(key: string, value: object): void {
        this.createStealthy(key, value)
        // todo: send update message
    }

    protected createStealthy(key: string, value: object): void {
        // console.log('create', key)
        if (typeof value === 'object')
            value = intercept(value, (object, method, ...args) =>
                this.sendMethodCall(object, method, ...args)
            )

        this.fields.set(key, value)
        this.fieldsReverseMap.set(value, key)
        // todo: send update message
    }

    public delete(key: string): boolean {
        return this.fields.delete(key)
        // todo: send update message
    }

    public addProcess(process: ChildProcess): Promise<void> {
        if (!process.send)
            throw new Error(`Process must have an ipc channel. Activate by passing "stdio: [<stdin>, <stdout>, <stderr>, 'ipc']" as an option.`)
        const messaging = new IPOSMessaging(process)

        let registered = false, resolve: Function
        const promise: Promise<void> = new Promise(res => resolve = res)
        messaging.listenForType('register', () => {
            if (registered) return
            registered = true

            this.processMessagingMap.set(process, messaging)
            this.syncProcess(process)
            resolve()
        })
        return promise
    }

    private syncProcess(process: ChildProcess) {
        this.processMessagingMap.get(process)?.send('sync', {
            fields: JSON.stringify(IPOS.serialize(this.fields))
        })
    }

    private sendMethodCall(object: object, method: string, ...args: any) {
        this.processMessagingMap.forEach(processMessaging => {
            processMessaging.send('update', {
                do: method,
                on: this.fieldsReverseMap.get(object),
                with: serialize(args)
            })
        })
    }

    /**
     * Serializes types that "JSON.stringify()" doesn't properly handle
     */
    public static serialize(value: any): any | void {
        return serialize(value)
    }

    public static deserialize(value: string | number | Array<any> | { $$iposType?: string, data: any }): any | void {
        return deserialize(value)
    }
}
