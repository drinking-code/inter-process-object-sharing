import IPOS from './main.js'

export default function initChild(this: IPOS) {
    let resolve: Function
    const promise = new Promise(res => resolve = res)

    this.messaging?.listenForType('sync', message => {
        if (!message.fields || !(message.fields instanceof Map)) return
        Array.from(message.fields.entries())
            .map(([key, value]: [string, any]) => {
                this.createStealthy(key, value)
            })
        this.messaging?.send('sync_ok')
        resolve()
    })
    // register with parent process
    this.messaging?.send('register')

    if (this.messaging)
        this.mountListeners(this.messaging)

    return promise
}
