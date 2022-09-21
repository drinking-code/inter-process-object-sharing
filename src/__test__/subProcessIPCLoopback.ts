export default class subProcessIPCLoopback {
    private originalProcessSend;
    private readonly originalProcessOn;
    private subProcessListener?: NodeJS.MessageListener;
    private mainProcessListener?: NodeJS.MessageListener;

    constructor() {
        this.originalProcessSend = process.send
        this.originalProcessOn = process.on
        process.send = (message: any) => {
            if (this.subProcessListener)
                this.subProcessListener(message, this.send)
            return true
        }
        process.on = (event: string, listener: (...args: any[]) => void) => {
            if (event === 'message') {
                this.mainProcessListener = listener
                return process
            } else {
                return this.originalProcessOn(event, listener)
            }
        }
    }

    public send(message: any) {
        if (this.mainProcessListener)
            this.mainProcessListener(message, process.send)
    }

    public on(event: 'message', listener: NodeJS.MessageListener): this {
        this.subProcessListener = listener
        return this
    }

    public destroy() {
        process.send = this.originalProcessSend
        process.on = this.originalProcessOn
        this.mainProcessListener = undefined
        this.subProcessListener = undefined
    }
}
