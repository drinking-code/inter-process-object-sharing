import initChild from './init-child.js';
import IPOSMessaging from './messaging.js';
import intercept from './intercept.js';
export default class IPOS {
    fields;
    fieldsRaw;
    fieldsReverseMap;
    processMessagingMap;
    proxy;
    messaging;
    static new() {
        const ipos = new IPOS();
        // was called on child process
        if (process.send) {
            return new Promise(async (resolve) => {
                await initChild.call(ipos);
                resolve(ipos);
            });
        }
        return ipos;
    }
    constructor() {
        this.fields = new Map();
        this.fieldsRaw = new Map();
        this.fieldsReverseMap = new Map();
        this.processMessagingMap = new Map();
        if (process.send) {
            this.messaging = new IPOSMessaging(process);
        }
        // proxy makes all "target.fields" available as "actual" fields
        this.proxy = new Proxy(this, {
            get(target, name) {
                if (Reflect.has(target, name)) {
                    return Reflect.get(target, name);
                }
                else if (target.fields.has(name)) {
                    return target.fields.get(name);
                }
            },
            set(target, name, value) {
                if (Reflect.has(target, name)) {
                    throw Error(`Cannot change inherent property \`${name}\``);
                }
                else if (!target.fields.has(name)) {
                    throw Error(`Cannot set unknown field \`${name}\`. Initialise a field with \`.create()\``);
                }
                else {
                    target.create(name, value);
                    return true;
                }
            },
        });
        return this.proxy;
    }
    /****************** MESSAGING *******************/
    mountListeners(messaging) {
        messaging.listenForType('update', (message) => this.performUpdate(message));
        messaging.listenForType('set', (message) => this.performSet(message));
        messaging.listenForType('delete', (message) => this.performDelete(message));
    }
    sendToAll(type, data) {
        this.messaging?.send(type, data);
        this.processMessagingMap.forEach(processMessaging => {
            processMessaging.send(type, data);
        });
    }
    /*public getNonIPOSMessages(process: ChildProcess, handler: (message: any) => any) {
        this.processMessagingMap.get(process)?.getNonIPOSMessages(handler)
    }*/
    /********************* GET **********************/
    get(key) {
        return this.fields.get(key);
    }
    getRaw(key) {
        return this.fields.get(key);
    }
    /******************** CREATE ********************/
    create(key, value) {
        this.createStealthy(key, value);
        this.sendToAll('set', { key, value });
    }
    createStealthy(key, value) {
        this.fieldsRaw.set(key, value);
        if (typeof value === 'object')
            value = intercept(value, key, (key, method, ...args) => this.sendMethodCall(key, method, ...args));
        this.fields.set(key, value);
        this.fieldsReverseMap.set(value, key);
    }
    performSet(message) {
        if (!message.key || !message.value)
            return;
        this.createStealthy(message.key, message.value);
    }
    /******************** UPDATE ********************/
    performUpdate(message) {
        if (!message.do || !message.on)
            return;
        if (message.do === '$$iposDefine') {
            if (!message.with)
                return;
            this.fieldsRaw.get(message.on)[message.with[0]] = message.with[1];
        }
        else {
            this.fieldsRaw.get(message.on)[message.do](...(message.with ?? []));
        }
    }
    sendMethodCall(key, method, ...args) {
        this.sendToAll('update', {
            do: method,
            on: key,
            with: Array.from(args)
        });
    }
    /******************** DELETE ********************/
    delete(key) {
        this.sendToAll('delete', { key });
        return this.deleteStealthy(key);
    }
    deleteStealthy(key) {
        return this.fields.delete(key);
    }
    performDelete(message) {
        if (!message.key)
            return;
        return this.deleteStealthy(message.key);
    }
    /******************* PROCESS ********************/
    addProcess(process) {
        if (!process.send)
            throw new Error(`Process must have an ipc channel. Activate by passing "stdio: [<stdin>, <stdout>, <stderr>, 'ipc']" as an option.`);
        const messaging = new IPOSMessaging(process);
        let registered = false, resolve;
        const promise = new Promise(res => resolve = res);
        messaging.listenForType('register', () => {
            if (registered)
                return;
            registered = true;
            this.mountListeners(messaging);
            this.processMessagingMap.set(process, messaging);
            this.syncProcess(process)
                .then(() => resolve());
        });
        return promise;
    }
    syncProcess(process) {
        let resolve;
        const promise = new Promise(res => resolve = res);
        this.processMessagingMap.get(process)?.send('sync', { fields: this.fields });
        this.processMessagingMap.get(process)?.listenOnceForType('sync_ok', () => {
            resolve();
        });
        return promise;
    }
}
