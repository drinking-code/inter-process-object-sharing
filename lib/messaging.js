import { ChildProcess } from 'child_process';
import { deserialize, serialize } from './serialize.js';
const mustHaveSendError = new Error(`Process must have a \`.send()\` method.`);
export default class IPOSMessaging {
    listeners;
    nonIPOSListeners;
    process;
    constructor(process) {
        this.listeners = new Map();
        this.nonIPOSListeners = new Set();
        if (!process.send)
            throw mustHaveSendError;
        this.process = process;
        this.process.on('message', (message) => {
            try {
                if (message.protocol !== 'ipos')
                    // not a message from ipos
                    return this.nonIPOSListeners.forEach(callback => callback(message));
                if (message.type === 'ready') {
                    this.send('register');
                    return;
                }
                for (const property in message) {
                    if (!message.hasOwnProperty(property))
                        continue;
                    message[property] = deserialize(message[property]);
                }
                if (this.listeners.has('any')) {
                    this.listeners.get('any')
                        ?.forEach(callback => callback(message));
                }
                if (this.listeners.has(message.type)) {
                    this.listeners.get(message.type)
                        ?.forEach(callback => callback(message));
                }
            }
            catch (e) {
                // not a message from ipos
                this.nonIPOSListeners.forEach(callback => callback(message));
            }
        });
        // if the current process is a parent process
        if (process instanceof ChildProcess) {
            // send a "ready" message to receive another "register" (if an instance is initiated)
            this.send('ready');
        }
    }
    /*getNonIPOSMessages(handler: (message: any) => any) {
        this.nonIPOSListeners.add(handler)
    }*/
    send(type, data) {
        if (!this.process.send)
            throw mustHaveSendError;
        this.process.send({
            protocol: 'ipos',
            type,
            ...(Object.fromEntries(Object.entries(data ?? {})
                .map(([key, value]) => [key, serialize(value)])))
        });
    }
    listenForType(type, callback) {
        let callbacks = this.listeners.get(type) ?? [];
        callbacks.push(callback);
        this.listeners.set(type, callbacks);
    }
    listenOnceForType(type, callback) {
        let callbacks = this.listeners.get(type) ?? [];
        const onceCallback = (message) => {
            delete callbacks[callbacks.indexOf(onceCallback)];
            callback(message);
        };
        callbacks.push(onceCallback);
        this.listeners.set(type, callbacks);
    }
    listenForAll(callback) {
        this.listenForType('any', callback);
    }
}