/// <reference types="node" />
import { ChildProcess } from 'child_process';
import IPOSMessaging, { iposMessagingMessage, iposMessagingType } from './messaging.js';
export default class IPOS {
    private readonly fields;
    private readonly fieldsRaw;
    private fieldsReverseMap;
    private processMessagingMap;
    private readonly proxy;
    protected messaging?: IPOSMessaging;
    static new(): IPOS | Promise<IPOS>;
    constructor();
    /****************** MESSAGING *******************/
    protected mountListeners(messaging: IPOSMessaging): void;
    protected sendToAll(type: iposMessagingType, data?: {}): void;
    /********************* GET **********************/
    get(key: string): any;
    private getRaw;
    /******************** CREATE ********************/
    create(key: string, value: any): void;
    protected createStealthy(key: string, value: object): void;
    protected performSet(message: iposMessagingMessage): void;
    /******************** UPDATE ********************/
    protected performUpdate(message: iposMessagingMessage): void;
    private sendMethodCall;
    /******************** DELETE ********************/
    delete(key: string): boolean;
    deleteStealthy(key: string): boolean;
    performDelete(message: iposMessagingMessage): boolean | undefined;
    /******************* PROCESS ********************/
    addProcess(process: ChildProcess): Promise<void>;
    private syncProcess;
}
