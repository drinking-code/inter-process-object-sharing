export default class subProcessIPCLoopback {
    private readonly originalProcessSend;
    private readonly originalProcessOn;
    private subProcessListener?: NodeJS.MessageListener;
    private mainProcessListener?: NodeJS.MessageListener;
    private destroyListener?: NodeJS.ExitListener;

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

    public on(event: 'message' | 'close', listener: NodeJS.MessageListener | NodeJS.ExitListener): this {
        switch (event) {
            case "message":
                this.subProcessListener = listener as NodeJS.MessageListener
                break
            case 'close':
                this.destroyListener = listener as NodeJS.ExitListener
                break
        }
        return this
    }

    public destroy() {
        process.send = this.originalProcessSend
        process.on = this.originalProcessOn
        this.mainProcessListener = undefined
        this.subProcessListener = undefined
        if (this.destroyListener)
            this.destroyListener(0)
    }
}
