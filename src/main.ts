import {deserialize, serialize} from 'v8'
import {ChildProcess} from 'child_process'
import InterceptedArray from './array.js'
import IPOSMessaging from './messaging.js'

export default class IPOS {
    private fields: Map<string, object>
    private fieldsReverseMap: Map<object, string>
    private processes: Set<ChildProcess>
    private processMessagingMap: Map<ChildProcess, IPOSMessaging>
    private readonly proxy
    private messaging?: IPOSMessaging;

    static new(): IPOS {
        return new IPOS()
    }

    constructor() {
        this.fields = new Map()
        this.fieldsReverseMap = new Map()
        this.processes = new Set()
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
        // was called on child process
        if (process.send) {
            this.messaging?.listenForType('sync', message => {
                console.log(message)
                if (message.fields)
                    this.fields = deserialize(message.fields)
            })

            // register with parent process
            this.messaging = new IPOSMessaging(process)
            this.messaging.send('register')
        }
        return this.proxy
    }

    public create(key: string, value: object): void {
        if (Array.isArray(value)) {
            value = new InterceptedArray((object, method, ...args) =>
                this.sendMethodCall(object, method, ...args)
            )
        }
        /*Object.getOwnPropertyNames(Object.getPrototypeOf(value))
            .filter(methodName => !(methodName.startsWith('__') && methodName.endsWith('__')))
            .forEach(methodName => {
                if (!value[methodName]) return
                const method = value[methodName]
                value[methodName] = function (...args: any) {
                    // interception
                    console.log(methodName)
                    method.call(value, ...args)
                }
            })
        */
        this.fields.set(key, value)
        this.fieldsReverseMap.set(value, key)
        // todo: send update message
    }

    public delete(key: string): boolean {
        return this.fields.delete(key)
        // todo: send update message
    }

    public addProcess(process: ChildProcess) {
        if (!process.send)
            throw new Error(`Process must have an ipc channel. Activate by passing "stdio: [<stdin>, <stdout>, <stderr>, 'ipc']" as an option.`)
        const messaging = new IPOSMessaging(process)

        let registered = false
        messaging.listenForType('register', () => {
            if (registered) return
            registered = true

            this.processes.add(process)
            this.processMessagingMap.set(process, messaging)
            this.syncProcess(process)
        })
    }

    private syncProcess(process: ChildProcess) {
        console.log('sending sync')
        this.processMessagingMap.get(process)?.send('sync', {
            field: serialize(this.fields)
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

    // serializes types, that "JSON.stringify()" doesn't properly handle
    /*private static serialize(value: any): any | void {
        // todo: handle other builtins
        if (['string', 'number'].includes(typeof value)) {
            return value
        } else if (typeof value === 'function') {
            return value.toString()
        } else if (Array.isArray(value)) {
            return value.map(serialize)
        } else if (value.constructor === {}.constructor) {
            return Object.fromEntries(
                Array.from(
                    Object.entries(value)
                        .map(([key, value]) =>
                            [key, this.serialize(value)]
                        )
                )
            )
        } else {
            if (!value.stringify && !value.serialize)
                throw new Error(
                    `Class: \`${value.constructor.name}\` must have methods to serialize and deserialize objects. (\`.stringify()\`, \`.serialize()\`)`
                )
            // return value.toString()
        }
    }*/
}
