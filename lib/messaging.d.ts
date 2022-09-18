/// <reference types="node" />
/// <reference types="node" />
import { ChildProcess } from 'child_process';
export declare type iposMessagingType = 'ready' | 'register' | 'update' | 'sync' | 'sync_ok' | 'set' | 'delete';
declare type iposMessagingCallback = (message: iposMessagingMessage) => (any | void);
export declare type iposMessagingMessage = {
    protocol: 'ipos';
    type: iposMessagingType;
    fields?: string;
    do?: string;
    on?: string;
    with?: Array<any>;
    key?: string;
    value: any;
} & {
    [k: string]: string;
};
export default class IPOSMessaging {
    private listeners;
    private nonIPOSListeners;
    private process;
    constructor(process: ChildProcess | NodeJS.Process);
    send(type: iposMessagingType, data?: {}): void;
    listenForType(type: iposMessagingType | 'any', callback: iposMessagingCallback): void;
    listenOnceForType(type: iposMessagingType | 'any', callback: iposMessagingCallback): void;
    listenForAll(callback: iposMessagingCallback): void;
}
export {};
